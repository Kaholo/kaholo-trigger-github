const minimatch = require("minimatch");
const { verifySignature, findTriggers } = require("../helpers");

function controller(req, res) {
  let push = req.body;

  if (!push.repository) {
    console.log("Repo not found");
    return res.send("repo not found");
  }

  let repositoryURL = push.repository.clone_url; //Clone URL
  let pushBranch = push.ref.slice(11); //Get target branch name
  let secret = req.headers["x-hub-signature"]
    ? req.headers["x-hub-signature"].slice(5)
    : null;
  findTriggers(
    push,
    validateTriggerPush,
    { repositoryURL, pushBranch, secret },
    req,
    res
  );
}

async function validateTriggerPush(trigger, { repositoryURL, pushBranch, secret }) {
  const triggerRepoUrl = trigger.params.find((o) => o.name === "REPO_URL");
  const triggerPushBranch = trigger.params.find(
    (o) => o.name === "PUSH_BRANCH"
  );
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
  if (
    triggerPushBranch.value &&
    !minimatch(pushBranch, triggerPushBranch.value)
  ) {
    throw "Not matching pushed branch";
  }

  /**
   * verify the signature
   */
  return verifySignature(secret, triggerSecret.value);
}

module.exports = controller;
