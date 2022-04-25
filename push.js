const {
  matches,
  verifySignature,
} = require("./helpers");

function isInitialRequest(data) {
  return !data.ref && data.hook;
}

function extractRequestParams(req, data) {
  const [, pushTypeInfo, ...pushNameInfo] = data.ref.split("/");
  const [, , branchName] = data.base_ref.split("/");

  const pushName = Array.isArray(pushNameInfo) ? pushNameInfo.join("/") : pushNameInfo;
  let pushType = null;
  switch (pushTypeInfo) {
    case "heads":
      pushType = "branch";
      break;
    case "tags":
      pushType = "tag";
      break;
    default:
      throw new Error("Bad Push Type");
  }

  return {
    repositoryName: data.repository.name,
    pushName,
    pushType,
    branchName,
    secret: req.headers["x-hub-signature-256"],
  };
}

function extractTriggerParams(trigger) {
  return {
    repositoryNamePattern: trigger.params.repoName,
    branchNamePattern: trigger.params.branchPat,
    tagNamePattern: trigger.params.tagPat,
    secret: trigger.params.secret,
  };
}

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
    && (!matches(requestParams.branchName, triggerParams.branchNamePattern)
    || !matches(requestParams.pushName, triggerParams.tagNamePattern))
  ) {
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
