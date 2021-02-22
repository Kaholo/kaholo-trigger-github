const minimatch = require("minimatch");
const { verifySignature, findTriggers } = require("../helpers");

function controller(req, res) {
  let body = req.body;

  if (!body.repository) {
    console.log("Repo not found");
    return res.send("repo not found");
  }

  let repoName = body.repository.name; //Github repository name
  let targetBranch = body.pull_request.base.ref; //Get target branch name
  let sourceBranch = body.pull_request.head.ref; //Get source branch name
  let secret = req.headers["x-hub-signature"]
    ? req.headers["x-hub-signature"].slice(5)
    : null;
  findTriggers(
    body,
    validateTriggerPR,
    { repoName, targetBranch, sourceBranch, secret },
    req,
    res,
    "webhookPR"
  );
}

async function validateTriggerPR(
  trigger,
  { repoName, targetBranch, sourceBranch, secret }
) {
  const triggerRepoName = trigger.params.find((o) => o.name === "repoName");
  const toBranch = trigger.params.find((o) => o.name === "toBranch");
  const fromBranch = trigger.params.find((o) => o.name === "fromBranch");
  const triggerSecret = trigger.params.find((o) => o.name === "secret");
  /**
   * Check if the Repo URL is provided (else consider as ANY)
   * Check that the Repo URL is the same as provided by the Trigger and if not provided
   */
  if (triggerRepoName.value && repoName !== triggerRepoName.value) {
    throw "Not same repo";
  }

  /**
   * Check that To branch provided - else - consider as any.
   */
  if (toBranch.value && !minimatch(targetBranch, toBranch.value)) {
    throw "Not matching target branch";
  }

  /**
   * Check that From branch provided - else - consider as any.
   */
  if (fromBranch.value && !minimatch(sourceBranch, fromBranch.value)) {
    throw "Not matching target branch";
  }

  /**
   * verify signature
   */
  return verifySignature(secret, triggerSecret.value);
}

module.exports = controller;
