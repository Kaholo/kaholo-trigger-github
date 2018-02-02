const crypto = require('crypto');
const config = require("./config");
const Plugin = require("../../../api/models/plugin.model");
const pluginsService = require("../../../api/services/plugins.service");
const mapExecutionService = require("../../../api/services/map-execution.service");
const Trigger = require("../../../api/models/map-trigger.model");

module.exports = {
    webhook: function (req, res) {
        let triggerPlugin;
        let push = req.body;
        let url = push.repository.clone_url;
        let branch = push.ref.slice(11); // get only the branch name
        let signature = req.headers["x-hub-signature"] ? req.headers["x-hub-signature"].slice(5) : null;
        let p = new Promise((resolve, reject) => {
            resolve(Trigger.find({ plugin: config.name }))
        }).then((triggers) => {
            console.log("Found trigger", triggers.length);
            triggers.forEach(trigger =>
                new Promise((resolve, reject) => {
                    const triggerRepoUrl = trigger.params.find(o => o.name === 'REPO_URL');
                    const triggerSecret = trigger.params.find(o => o.name === 'SECRET');
                    const triggerBranch = trigger.params.find(o => o.name === 'BRANCH');
                    console.log(triggerRepoUrl, triggerSecret, triggerBranch);
                    if (url !== triggerRepoUrl.value) {
                        reject("Not same repo");
                    }
                    if (triggerBranch.value) {
                        if (triggerBranch.value !== branch) {
                            reject("Not same branch")
                        }
                    }
                    if (signature && !triggerSecret.value) {
                        reject("Secret was expected yet none provided");
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
                        reject("Signature was expected, yet none provided");
                    } else if (!signature && !triggerSecret.value) {
                        resolve();
                    } else {
                        reject("Unexpected error occurred");
                    }
                }).then(() => {
                    res.send('OK');
                    console.log(trigger.map);
                    mapExecutionService.execute(trigger.map, 1, 0, req)
                }).catch((error) => res.send(error))
            )
        })

    }
};