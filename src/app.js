const crypto = require('crypto');
const config = require("./config");
const mapExecutionService = require("../../../api/services/map-execution.service");
const Trigger = require("../../../api/models/map-trigger.model");
const minimatch = require("minimatch")


function findTriggers(body, validatationFn, startParams, req, res){
    Trigger.find({ plugin: config.name }).then((triggers) => {
        console.log(`Found ${triggers.length} triggers`);
        res.send('OK');
        triggers.forEach(trigger=>{  
            validatationFn(trigger,startParams)
            .then(exec(trigger, body, req.io))
            .catch(console.error);
        });
    }).catch((error) => res.send(error))
}

function exec(trigger, body, io){
    return ()=>{
        console.log(trigger.map);
        let message = trigger.name + ' - Started by Github trigger';
        console.log(`******** Github: executing map ${trigger.map} ********`);
        mapExecutionService.execute(trigger.map, null, io, {config : trigger.configuration}, message, body);
    }
}

function controllerfunctionPR (req, res) {
    let body = req.body;
    
    if(!body.repository) {
        console.log('Repo not found')
        return res.send('repo not found')
    }
    
    let repositoryURL = body.repository.clone_url //Github HttpURL
    let targetBranch = body.pull_request.base.ref; //Get target branch name
    let sourceBranch = body.pull_request.head.ref; //Get source branch name
    let secret = req.headers["x-hub-signature"] ? req.headers["x-hub-signature"].slice(5) : null;
    findTriggers(body, validateTriggerPR, {repositoryURL, targetBranch, sourceBranch, secret},req, res);
}


function validateTriggerPR(trigger, {repositoryURL, targetBranch, sourceBranch, secret}){
    return new Promise((resolve, reject) => {
        
        const triggerRepoUrl = trigger.params.find(o => o.name === 'REPO_URL');
        const toBranch = trigger.params.find(o => o.name === 'TO_BRANCH');
        const fromBranch = trigger.params.find(o => o.name === 'FROM_BRANCH');
        const triggerSecret = trigger.params.find(o => o.name === 'SECRET');
        /**
         * Check if the Repo URL is provided (else consider as ANY)
         * Check that the Repo URL is the same as provided by the Trigger and if not provided 
        */
        if (triggerRepoUrl.value && repositoryURL !== triggerRepoUrl.value) {
            return reject("Not same repo");
        }

        /**
         * Check that To branch provided - else - consider as any.
         */
        if (toBranch.value &&  !minimatch(targetBranch, toBranch.value)) {
                return reject("Not matching target branch")
        }

        /**
         * Check that From branch provided - else - consider as any.
         */
        if (fromBranch.value &&  !minimatch(sourceBranch, fromBranch.value)) {
            return reject("Not matching target branch")
        }

        if (secret && !triggerSecret.value) {
            return reject("Secret was expected yet none provided");
        } else if (secret && triggerSecret.value) {
            const hmac = crypto.createHmac('SHA1', triggerSecret.value);
            hmac.on('readable', () => {
                const data = hmac.read();
                if (data) {
                    let hash = data.toString('hex');
                    if (!(hash === secret)) {
                        reject("The signature doesn't match the trigger's secret");
                    } else {
                        resolve()
                    }
                }
            });
        } 
        return resolve();
    })
}

function controllerfunctionPush(req,res){
    let push = req.body;
    
    if(!push.repository) {
        console.log('Repo not found')
        return res.send('repo not found')
    }
    
    let repositoryURL = push.repository.clone_url //Clone URL
    let pushBranch = push.ref.slice(11); //Get target branch name
    let secret = req.headers["x-hub-signature"] ? req.headers["x-hub-signature"].slice(5) : null;
    findTriggers(push, validateTriggerPush, {repositoryURL, pushBranch, secret},req, res);
}

function validateTriggerPush(trigger, {repositoryURL, pushBranch, secret}){
    return new Promise((resolve, reject) => {
        const triggerRepoUrl = trigger.params.find(o => o.name === 'REPO_URL');
        const triggerPushBranch = trigger.params.find(o => o.name === 'PUSH_BRANCH');
        const triggerSecret = trigger.params.find(o => o.name === 'SECRET');
        /**
         * Check if the Repo URL is provided (else consider as ANY)
         * Check that the Repo URL is the same as provided by the Trigger and if not provided 
        */
        if (triggerRepoUrl.value && repositoryURL !== triggerRepoUrl.value) {
            return reject("Not same repo");
        }

        /**
         * Check that To branch provided - else - consider as any.
         */
         if (triggerPushBranch.value && !minimatch(pushBranch, triggerPushBranch.value)) {
                return reject("Not matching pushed branch")
        }

        /**
         * Handle the secret
         */
        if (secret && !triggerSecret.value) {
            return reject("Secret was expected yet none provided");
        } else if (secret && triggerSecret.value) {
            const hmac = crypto.createHmac('SHA1', triggerSecret.value);
            hmac.on('readable', () => {
                const data = hmac.read();
                if (data) {
                    let hash = data.toString('hex');
                    if (!(hash === secret)) {
                        reject("The signature doesn't match the trigger's secret");
                    } else {
                        resolve()
                    }
                }
            });
        } 
        return resolve();
    });
}


function pushToTag (req,res) {
    let push = req.body;
    
    if(!push.repository) {
        console.log('Repo not found')
        return res.send('repo not found')
    }
    
    //let repositoryURL = push.repository.clone_url //Clone URL
    //let pushBranch = push.ref.slice(11); //Get target branch name
    let tagName = push.ref.split("/").pop();
    let created = push.created;
    let repoName = push.repository.name;
    let secret = req.headers["x-hub-signature"] ? req.headers["x-hub-signature"].slice(5) : null;
    findTriggers(push, validatePTT, {tagName, created, repoName, secret},req, res);
}


function  validatePTT(trigger, {tagName, created, repoName, secret}) {
    return new Promise((resolve, reject) => {
        const triggerRepoName = trigger.params.find(o => o.name === 'REPO_NAME');
        const triggerTagName = trigger.params.find(o => o.name === 'TAG_NAME');
        const triggerSecret = trigger.params.find(o => o.name === 'SECRET');
        const triggerTagPattern = trigger.params.find(o => o.name === 'TAG_PATTERN');
        
        /**
         * Make sure that it is a tag created and NOT deleted
         */

         if (!created) {
             return reject("Tag is deleted")
         }
        /**
         * Check if the Repo URL is provided (else consider as ANY)
         * Check that the Repo URL is the same as provided by the Trigger and if not provided 
        */
        if (triggerRepoName.value && repoName !== triggerRepoName.value) {
            return reject("Not same repo");
        }

        /**
         * Check tag name matches the trigger tag name or the trigger tag pattern
         */
        
        if (triggerTagName.value && triggerTagName.value != tagName) {
            return reject("Tag is not equal")
        }

        if (triggerTagPattern.value && !tagName.startsWith(triggerTagPattern.value)) {
            return reject("Tag name does not start as the pattern")
        }
        
        /**
         * Handle the secret
         */
        if (secret && !triggerSecret.value) {
            return reject("Secret was expected yet none provided");
        } else if (secret && triggerSecret.value) {
            const hmac = crypto.createHmac('SHA1', triggerSecret.value);
            hmac.on('readable', () => {
                const data = hmac.read();
                if (data) {
                    let hash = data.toString('hex');
                    if (!(hash === secret)) {
                        reject("The signature doesn't match the trigger's secret");
                    } else {
                        resolve()
                    }
                }
            });
        } 
        return resolve();
    });
}


module.exports = {
    webhookPush: controllerfunctionPush,
    PUSH_TO_TAG: pushToTag,
    webhookPR: controllerfunctionPR
}