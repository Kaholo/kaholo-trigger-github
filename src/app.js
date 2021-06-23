const { verifyRepoName, verifySignature } = require("./helpers");
const minimatch = require("minimatch")

async function webhookPush(req, res, settings, triggerControllers) {
    if (!triggerControllers) {
        return res.status(400).send("triggers cannot be nil");
    }
    try {
        const body = req.body;
        const [_temp, refType, pushName] = req.body.ref.split("/");
        // get the push type from ref type
        const pushType = refType === "heads" ?  "branch" : 
                            refType === "tags"  ?  "tag"    : "";
        if (pushType === "") {
            return res.status(400).send("Bad Push Type");
        }
        const reqRepoName = body.repository.name; //Github repository name
        const reqSecret = req.headers["x-hub-signature-256"];
        const paramName = `${pushType}Pat`;

        triggerControllers.forEach((trigger) => {
            if (!verifyRepoName(trigger, reqRepoName) || !verifySignature(trigger, reqSecret, body)) return;
            const validateParam = trigger.params[paramName];
            if (!validateParam || !minimatch(pushName, validateParam)) return;
            const msg = `${reqRepoName} ${pushType} Push`;
            trigger.execute(msg, body);
        });
        res.status(200).send("OK");
    }
    catch (err){
        res.status(422).send(err.toString());
    }
}

async function webhookPR(req, res, settings, triggerControllers) {
    if (!triggerControllers) {
        return res.status(400).send("triggers cannot be nil");
    }
    try {
        const body = req.body;
        const reqRepoName = body.repository.name; //Github repository name
        const reqSecret = req.headers["x-hub-signature-256"]
        const reqTargetBranch = body.pull_request.base.ref; //Get target branch name
        const reqSourceBranch = body.pull_request.head.ref; //Get source branch name
        const merged = body.pull_request.merged;
        const reqActionType =  body.action === "closed" ? (merged ? "merged" : "declined") : body.action;
    
        triggerControllers.forEach((trigger) => {
            if (!verifyRepoName(trigger, reqRepoName) || !verifySignature(trigger, reqSecret, body)) return;
            const {toBranch, fromBranch, actionType} = trigger.params;
            if (toBranch && !minimatch(reqTargetBranch, toBranch)) return;
            // Check that From branch provided is same as request. If not provided consider as any.
            if (fromBranch && !minimatch(reqSourceBranch, fromBranch)) return;
            // Check that action type provided is same as request. If not provided consider as any.
            if (actionType && actionType !== "any" && triggerActionType !== reqActionType) return;
            const msg = `${reqRepoName} ${reqSourceBranch}->${reqTargetBranch} PR ${reqActionType}`
            trigger.execute(msg, body);
        });
        res.status(200).send("OK");
    }
    catch (err){
        res.status(422).send(err.message);
    }
}

module.exports = {
    webhookPush,
    webhookPR
}