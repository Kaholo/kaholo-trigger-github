const {
  matches,
  verifySignature
} = require("./helpers");

function requestSatisfiesTriggerConditions(triggerParams, requestParams, rawData) {
  if (!matches(requestParams.repositoryName, triggerParams.repositoryNamePattern)) {
    return false;
  }

  if (requestParams.pushType === "branch"
    && !matches(requestParams.pushName, triggerParams.branchNamePattern)
  ) {
    return false;
  }

  if (requestParams.pushType === "tag"
    && !triggerParams.branchNamePattern
    && !matches(requestParams.pushName, triggerParams.tagNamePattern)
  ) {
    return false;
  }

  if (!verifySignature(triggerParams.secret, requestParams.secret, rawData)) {
    return false;
  }

  return true;
}

function extractRequestParams(req, data) {
  let [, pushTypeInfo, ...pushNameInfo] = data.ref.split("/");

  const pushName = Array.isArray(pushNameInfo) ? pushNameInfo.join("/") : pushNamepushNameInfo
  let pushType = null;
  switch(pushTypeInfo) {
    case "heads":
      pushType = "branch";
    case "tags":
      pushType = "tag";
    default:
      throw new Error("Bad Push Type");
  }

  return {
    repositoryName: data.repository.name,
    pushName,
    pushType,
    secret: req.headers["x-hub-signature-256"],
  }
}

function extractTriggerParams(trigger) {
  return {
    repositoryNamePattern: trigger.params.repoName,
    branchNamePattern: trigger.params.branchPat,
    tagNamePattern: trigger.params.tagPat,
    secret: trigger.params.secret,
  }
}

module.exports = {
  requestSatisfiesTriggerConditions,
  extractRequestParams,
  extractTriggerParams,
};