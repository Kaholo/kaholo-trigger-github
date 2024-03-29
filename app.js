const Push = require("./push");
const PullRequest = require("./pullRequest");

const {
  verifySignature,
  extractData,
  matches,
} = require("./helpers");

async function webhookPush(req, res, settings, triggerControllers) {
  try {
    if (req.headers["x-github-event"] !== "push") {
      throw new Error(`Rejected GitHub Event: ${JSON.stringify(req.headers["x-github-event"])}`);
    }

    const pipelinesTriggered = [];
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

      pipelinesTriggered.push({
        repository: requestParams.repositoryName,
        branch: requestParams.branchName,
      });
      trigger.execute(executionMessage, data);
    });

    if (pipelinesTriggered.length === 0) {
      throw new Error("No pipelines were triggered");
    }

    res.json({ pipelinesTriggered });
  } catch (error) {
    res.status(422).send(error.toString());
  }

  return Promise.resolve();
}

async function webhookPR(req, res, settings, triggerControllers) {
  try {
    if (req.headers["x-github-event"] !== "pull_request") {
      throw new Error(`Rejected GitHub Event: ${JSON.stringify(req.headers["x-github-event"])}`);
    }

    const pipelinesTriggered = [];
    const [rawData, data] = extractData(req);

    if (PullRequest.isInitialRequest(data)) {
      return res.status(200).send("OK");
    }

    const requestParams = PullRequest.extractRequestParams(req, data);
    const executionMessage = (
      `Github ${requestParams.repositoryName}\n`
      + `${requestParams.fromBranch}->${requestParams.toBranch}\n`
      + `PR ${requestParams.actionType}`
    );

    triggerControllers.forEach((trigger) => {
      const triggerParams = PullRequest.extractTriggerParams(trigger);

      if (!PullRequest.requestSatisfiesTriggerConditions(triggerParams, requestParams, rawData)) {
        return;
      }

      pipelinesTriggered.push({
        repository: requestParams.repositoryName,
        action: triggerParams.actionType,
      });
      trigger.execute(executionMessage, { data, triggerParams, requestParams });
    });

    if (pipelinesTriggered.length === 0) {
      throw new Error("No pipelines were triggered");
    }

    res.json({ pipelinesTriggered });
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

    const pipelinesTriggered = [];
    const [rawData, data] = extractData(req);

    const githubEventAction = data.action;
    const githubHash = req.headers["x-hub-signature-256"];

    const executionMessage = (
      `Github ${data.repository.name}\n`
      + `Release ${data.release.tag_name}`
    );

    triggerControllers.forEach((triggerController) => {
      const {
        repoName,
        secret,
        eventAction,
      } = triggerController.params;

      const isTriggerInvalid = (
        (repoName && !matches(data.repository.name, repoName))
        || (eventAction && eventAction !== "any" && eventAction !== githubEventAction)
        || !verifySignature(secret, githubHash, rawData)
      );

      if (isTriggerInvalid) {
        return;
      }

      pipelinesTriggered.push({
        repository: repoName,
        action: githubEventAction,
        name: triggerController.name,
      });
      triggerController.execute(executionMessage, data);
    });

    if (pipelinesTriggered.length === 0) {
      throw new Error("No pipelines were triggered");
    }

    res.json({ pipelinesTriggered });
  } catch (error) {
    res.status(422).send(error.message);
  }
}

module.exports = {
  webhookPush,
  webhookPR,
  webhookRelease,
};
