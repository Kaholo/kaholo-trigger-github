const Push = require("./push");
const PullRequest = require("./pullRequest");

function extractData(req) {
  let rawData = null;
  let data = null;
  switch (req.headers["content-type"]) {
    case "application/json":
      rawData = req.body;
      data = req.body;
      break;
    case "application/x-www-form-urlencoded":
      rawData = req.rawBody;
      data = JSON.parse(req.body.payload);
      break;
    default:
      throw new Error(`Unsupported 'content-type' header. Received: ${req.headers["content-type"]}`);
  }

  return [rawData, data];
}

async function webhookPush(req, res, settings, triggerControllers) {
  try {
    const [rawData, data] = extractData(req);

    if (Push.isInitialRequest(data)) {
      return res.status(200).send("OK");
    }

    let requestParams = null;
    try {
      requestParams = Push.extractRequestParams(req, data);
    } catch (error) {
      return res.status(400).send(error.message);
    }

    const executionMessage = `\
Github ${requestParams.repositoryName} \
${requestParams.pushName} \
${requestParams.pushType} Push`;

    triggerControllers.forEach((trigger) => {
      const triggerParams = Push.extractTriggerParams(trigger);

      if (!Push.requestSatisfiesTriggerConditions(triggerParams, requestParams, rawData)) {
        return;
      }

      trigger.execute(executionMessage, data);
    });

    return res.status(200).send("OK");
  } catch (error) {
    res.status(422).send(error.toString());
  }

  return Promise.resolve();
}

async function webhookPR(req, res, settings, triggerControllers) {
  try {
    const [rawData, data] = extractData(req);

    if (PullRequest.isInitialRequest(data)) {
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
  } catch (error) {
    res.status(422).send(error.message);
  }

  return Promise.resolve();
}

module.exports = {
  webhookPush,
  webhookPR,
};
