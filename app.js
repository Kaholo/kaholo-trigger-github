const Push = require("./push");
const PullRequest = require("./pullRequest");

const {
  verifySignature,
  extractData,
  matches,
} = require("./helpers");

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

async function webhookRelease(req, res, settings, triggerControllers) {
  try {
    if (req.headers["x-github-event"] !== "release") {
      throw new Error(`Rejected GitHub Event: ${JSON.stringify(req.headers["x-github-event"])}`);
    }

    const [rawData, data] = extractData(req);

    if (data.action !== "released") {
      throw new Error(`Rejected Release Action: ${JSON.stringify(data.action)}`);
    }

    const githubHash = req.headers["x-hub-signature-256"];

    const executionMessage = (
      `Github ${data.repository.name}\n`
    + `Release ${data.release.tag_name}`
    );

    triggerControllers.forEach((trigger) => {
      const {
        repoName,
        secret,
      } = trigger.params;

      if (repoName && matches(data.repository.name, repoName)) {
        return;
      }
      if (!verifySignature(secret, githubHash, rawData)) {
        return;
      }

      trigger.execute(executionMessage, data);
    });

    res.status(200).send("OK");
  } catch (error) {
    res.status(422).send(error.message);
  }
}

module.exports = {
  webhookPush,
  webhookPR,
  webhookRelease,
};
