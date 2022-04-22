const { verifySignature, matches } = require("./helpers");

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
    const msg = `Github ${repositoryName} ${pushInfo.name} ${pushInfo.type} Push`;
    triggerControllers.forEach((trigger) => {
      // trigger.params.repoName - the pattern
      if (!matches(repositoryName, trigger.params.repoName)) {
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

      if (!verifySignature(trigger, requestsSecret, rawData)) {
        return;
      }

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

function isPRRequestValid(triggerParams, requestParams, rawData) {
  if (!matches(requestParams.repositoryName, triggerParams.repositoryNamePattern)) {
    return false;
  }

  if (!matches(requestParams.toBranch, triggerParams.toBranch)) {
    return false;
  }

  if (!matches(requestParams.fromBranch, triggerParams.fromBranch)) {
    return false;
  }

  if (triggerParams.actionType
    && triggerParams.actionType !== "any"
    && triggerParams.actionType !== requestParams.actionType) {
    return false;
  }

  if (!verifySignature(triggerParams.secret, requestParams.secret, rawData)) {
    return false;
  }

  return true;
}

async function webhookPR(req, res, settings, triggerControllers) {
  try {
    const [rawData, data] = extractData(req);

    if (isInitialPRRequest(data)){
        return res.status(200).send("OK");
    }

    const repositoryName = data.repository.name;
    const requestsSecret = req.headers["x-hub-signature-256"];
    const requestParams = {
      repositoryName,
      secret: requestsSecret,
      toBranch: data.pull_request.base.ref,
      fromBranch: data.pull_request.head.ref,
      actionType: data.action === "closed" ? (data.pull_request.merged ? "merged" : "declined") : data.action,
    };

    const msg = `Github ${repositoryName} ${requestParams.fromBranch}->${requestParams.toBranch} PR ${requestParams.actionType}`

    triggerControllers.forEach((trigger) => {
      const triggerParams = {
        repositoryNamePattern: trigger.params.repoName,
        secret: trigger.params.secret,
        toBranch: trigger.params.toBranch,
        fromBranch: trigger.params.fromBranch,
        actionType: trigger.params.actionType,
      };

      if (!isPRRequestValid(triggerParams, requestParams, rawData)) {
        return;
      }

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