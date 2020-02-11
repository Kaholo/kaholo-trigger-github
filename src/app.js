const crypto = require('crypto');
const config = require("./config");
const mapExecutionService = require("../../../api/services/map-execution.service");
const Trigger = require("../../../api/models/map-trigger.model");
const minimatch = require("minimatch")

module.exports = {
    webhook: function (req, res) {
        if(req.get('X-GitHub-Event') == 'ping'){
            return res.send('OK');
        }

        let push;
        if(!req.body.repository && req.body.payload && (typeof req.body.payload == 'string')){
            push = JSON.parse(req.body.payload)
        }
        else {
            push = req.body;
        }
        
        let url = push.repository.clone_url;
        let branch = push.ref.slice(11); // get only the branch name
        let signature = req.headers["x-hub-signature"] ? req.headers["x-hub-signature"].slice(5) : null;
        
        Trigger.find({ plugin: config.name }).then((triggers) => {
            console.log(`Found ${triggers.length} triggers`);
            res.send('OK');
            triggers.forEach(trigger=>execTrigger(trigger,{push, url, branch, signature},req.io))
        }).catch((error) => res.send(error))
    }
};

function execTrigger(trigger, {push, url, branch, signature}, io){
    new Promise((resolve, reject) => {
        const triggerRepoUrl = trigger.params.find(o => o.name === 'REPO_URL');
        const triggerSecret = trigger.params.find(o => o.name === 'SECRET');
        const triggerBranch = trigger.params.find(o => o.name === 'BRANCH');
        
        if (url !== triggerRepoUrl.value) {
            console.log(url, triggerRepoUrl.value);
            return reject("Not same repo");
        }

        if (triggerBranch.value && !minimatch(branch, triggerBranch.value)) {
            return reject("Not matching branch")
        }
        
        if (signature && !triggerSecret.value) {
            return reject("Secret was expected yet none provided");
        } else if (signature && triggerSecret.value) {
            const hmac = crypto.createHmac('SHA1', triggerSecret.value);
            hmac.on('readable', () => {
                const data = hmac.read();
                if (data) {
                    let hash = data.toString('hex');
                    if (!(hash === signature)) {
                        reject("The signature doesn't match the trigger's secret");
                    } else {
                        resolve()
                    }
                }
            });
            hmac.write(JSON.stringify(push));
            hmac.end();

        } else if (!signature && triggerSecret.value) {
            return reject("Signature was expected, yet none provided");
        } else {
            return resolve();
        }

    }).then(() => {
        console.log(trigger.map);
        let message = trigger.name + ' - Started by github trigger';
        if (push.sender && push.sender.login) {
            message += ` (push by ${push.sender.login}`
        }
        console.log(`******** Github: executing map ${trigger.map} ********`);
        mapExecutionService.execute(trigger.map, null, io, {config : trigger.configuration}, message, push);
    }).catch(err=>{
        console.error(err);
    })
}