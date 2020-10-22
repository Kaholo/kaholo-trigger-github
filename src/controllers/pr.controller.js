const minimatch = require("minimatch");
const { verifySignature, findTriggers } = require("../helpers");

function controller(req, res) {
  let body = req.body;

  if (!body.repository) {
    console.log("Repo not found");
    return res.send("repo not found");
  }

  let repositoryURL = body.repository.clone_url; //Github HttpURL
  let targetBranch = body.pull_request.base.ref; //Get target branch name
  let sourceBranch = body.pull_request.head.ref; //Get source branch name
  let secret = req.headers["x-hub-signature"]
    ? req.headers["x-hub-signature"].slice(5)
    : null;
  findTriggers(
    body,
    validateTriggerPR,
    { repositoryURL, targetBranch, sourceBranch, secret },
    req,
    res
  );
}

async function validateTriggerPR(
  trigger,
  { repositoryURL, targetBranch, sourceBranch, secret }
) {
  const triggerRepoUrl = trigger.params.find((o) => o.name === "REPO_URL");
  const toBranch = trigger.params.find((o) => o.name === "TO_BRANCH");
  const fromBranch = trigger.params.find((o) => o.name === "FROM_BRANCH");
  const triggerSecret = trigger.params.find((o) => o.name === "SECRET");
  /**
   * Check if the Repo URL is provided (else consider as ANY)
   * Check that the Repo URL is the same as provided by the Trigger and if not provided
   */
  if (triggerRepoUrl.value && repositoryURL !== triggerRepoUrl.value) {
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
