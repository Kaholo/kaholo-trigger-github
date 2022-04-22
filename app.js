const { verifySignature, matches } = require("./helpers");
const PullRequest = require("./pullRequest");

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


async function webhookPR(req, res, settings, triggerControllers) {
  try {
    const [rawData, data] = extractData(req);

    if (PullRequest.isInitialRequest(data)){
        return res.status(200).send("OK");
    }

    const requestParams = PullRequest.extractRequestParams(req, data);
    const executionMessage = `\
Github ${requestParams.repositoryName} \
${requestParams.fromBranch}->${requestParams.toBranch} \
PR ${requestParams.actionType}`;

    triggerControllers.forEach((trigger) => {
      const triggerParams = PullRequest.extractTriggerParams(trigger);
      if (!PullRequest.requestSatisfiesTriggerConditions(triggerParams, requestParams, rawData)) {
        return;
      }

      trigger.execute(executionMessage, data);
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