const { verifyRepoName, verifySignature, isMatch } = require("./helpers");

function extractData(req) {
  let rawData = null;
  let data = null;
  switch(req.headers["content-type"]) {
    case "application/json":
      rawData = req.body;
      data = req.body;
    case "application/x-www-form-urlencoded":
      rawData = req.body.payload;
      data = JSON.parse(req.body.payload);
    default:
      throw new Error(`Unsupported 'content-type' header. Received: ${req.headers["content-type"]}`);
  }

  return [rawData, data];
}

function isInitialPushRequest(data) {
  return !data.ref && data.hook;
};

function getPushInfo(data) {
  const pushInfo = {};

  let [, pushType, ...pushName] = data.ref.split("/");

  pushInfo.name = Array.isArray(pushName) ? pushName.join("/") : pushName;
  switch(pushType) {
    case "heads":
      pushInfo.type = "branch";
    case "tags":
      pushInfo.type = "tag";
    default:
      return null;
  }

  return pushInfo;
}

async function webhookPush(req, res, settings, triggerControllers) {
  try {
    const [rawData, data] = extractData(req);

    if (isInitialPushRequest(data)){
        return res.status(200).send("OK");
    }

    const pushInfo = getPushInfo(data);
    if (!pushInfo) {
      return res.status(400).send("Bad Push Type");
    }

    const repositoryName = data.repository.name;
    const requestsSecret = req.headers["x-hub-signature-256"];
    triggerControllers.forEach((trigger) => {
        if (!verifyRepoName(trigger, repositoryName)) {
          return;
        }

        if (!verifySignature(trigger, requestsSecret, rawData)) {
          return;
        }

        // If both weren't provided, don't filter by push name
        if (trigger.params.tagPat || trigger.params.branchPat) {
          // Pat means pattern :|
          const validateParam = trigger.params[`${pushInfo.type}Pat`];
          if (!validateParam || !isMatch(pushInfo.name, validateParam)) {
            return;
          }
        }

        const msg = `Github ${repositoryName} ${pushInfo.name} ${pushInfo.type} Push`;
        trigger.execute(msg, data);
    });

    return res.status(200).send("OK");
  }
  catch (err){
    res.status(422).send(err.toString());
  }
}

function isInitialPRRequest(data) {
  return !data.pull_request && data.hook;
};

async function webhookPR(req, res, settings, triggerControllers) {
    try {
      const [rawData, data] = extractData(req);

      const body = req.body;
        if (isInitialPRRequest(data)){
            // first request
            return res.status(200).send("OK");
        }
        const reqRepoName = data.repository.name; //Github repository name
        const reqSecret = req.headers["x-hub-signature-256"]
        const reqTargetBranch = data.pull_request.base.ref; //Get target branch name
        const reqSourceBranch = data.pull_request.head.ref; //Get source branch name
        const merged = data.pull_request.merged;
        const reqActionType =  data.action === "closed" ? (merged ? "merged" : "declined") : data.action;
    
        triggerControllers.forEach((trigger) => {
            if (!verifyRepoName(trigger, reqRepoName) || !verifySignature(trigger, reqSecret, rawData)) return;
            const {toBranch, fromBranch, actionType} = trigger.params;
            if (!isMatch(reqTargetBranch, toBranch)) return;
            // Check that From branch provided is same as request. If not provided consider as any.
            if (!isMatch(reqSourceBranch, fromBranch)) return;
            // Check that action type provided is same as request. If not provided consider as any.
            if (actionType && actionType !== "any" && actionType !== reqActionType) return;
            const msg = `Github ${reqRepoName} ${reqSourceBranch}->${reqTargetBranch} PR ${reqActionType}`
            trigger.execute(msg, data);
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