const minimatch = require("minimatch");
const { verifySignature, findTriggers } = require("../helpers");

function controller(req, res) {
  let push = req.body;

  if (!push.repository) {
    console.log("Repo not found");
    return res.send("repo not found");
  }

  try {
  let repoName = push.repository.name; //Clone URL
  let branch = push.ref.slice(11); //Get target branch name
  let secret = req.headers["x-hub-signature"]
    ? req.headers["x-hub-signature"].slice(5)
    : null;
  findTriggers(
    push,
    validateTriggerPush,
    { repoName, branch, secret },
    req,
    res,
    "webhookPush"
  );}
  catch (err){
    return res.send(err);
  }
}

async function validateTriggerPush(trigger, { repoName, branch, secret }) {
  const triggerRepoName = trigger.params.find((o) => o.name === "repoName");
  const triggerBranchPat = trigger.params.find((o) => o.name === "branchPat");
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
  if (triggerBranchPat.value && !minimatch(branch, triggerBranchPat.value)) {
    throw "Not matching pushed branch";
  }

  /**
   * verify the signature
   */
  return verifySignature(secret, triggerSecret.value);
}

module.exports = controller;
