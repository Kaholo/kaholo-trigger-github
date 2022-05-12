const { matches, verifySignature } = require("./helpers");

function isInitialRequest(data) {
  return !data.pull_request && data.hook;
}

function extractRequestParams(req, data) {
  let actionType;
  if (data.action === "closed") {
    actionType = data.pull_request.merged
      ? "merged"
      : "declined";
  } else {
    actionType = data.action;
  }

  return {
    repositoryName: data.repository.name,
    secret: req.headers["x-hub-signature-256"],
    toBranch: data.pull_request.base.ref,
    fromBranch: data.pull_request.head.ref,
    actionType,
  };
}

function extractTriggerParams(trigger) {
  return {
    repositoryNamePattern: trigger.params.repoName,
    secret: trigger.params.secret,
    toBranch: trigger.params.toBranch,
    fromBranch: trigger.params.fromBranch,
    actionType: trigger.params.actionType,
  };
}

function requestSatisfiesTriggerConditions(triggerParams, requestParams, rawData) {
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

module.exports = {
  isInitialRequest,
  extractRequestParams,
  extractTriggerParams,
  requestSatisfiesTriggerConditions,
};
