const { verifyRepoName, verifySignature, matches } = require("./helpers");

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

      // Pat means pattern :|
      if (pushInfo.type === "branch" && !matches(pushInfo.name, trigger.params.branchPat)) {
        return;
      }

      // Pat means pattern :|
      if (pushInfo.type === "tag" && !matches(pushInfo.name, trigger.params.tagPat
        && trigger.params.branchPat)) {
        return;
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

    if (isInitialPRRequest(data)){
        return res.status(200).send("OK");
    }


    const reqTargetBranch = data.pull_request.base.ref;
    const reqSourceBranch = data.pull_request.head.ref;
    const merged = data.pull_request.merged;
    const reqActionType =  data.action === "closed" ? (merged ? "merged" : "declined") : data.action;

    const repositoryName = data.repository.name;
    const requestsSecret = req.headers["x-hub-signature-256"];
    triggerControllers.forEach((trigger) => {
      if (!verifyRepoName(trigger, repositoryName)) {
        return;
      }

      if (!verifySignature(trigger, requestsSecret, rawData)) {
        return;
      }

      const { toBranch, fromBranch, actionType } = trigger.params;
      if (!matches(reqTargetBranch, toBranch)) {
        return;
      }

      if (!matches(reqSourceBranch, fromBranch)) {
        return;
      }

      if (actionType && actionType !== "any" && actionType !== reqActionType) {
        return;
      }

      const msg = `Github ${repositoryName} ${reqSourceBranch}->${reqTargetBranch} PR ${reqActionType}`
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