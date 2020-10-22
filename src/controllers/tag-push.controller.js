const minimatch = require("minimatch");
const { verifySignature, findTriggers } = require("../helpers");


function controller(req, res) {
  let push = req.body;

  if (!push.repository) {
    console.log("Repo not found");
    return res.send("repo not found");
  }

  //let repositoryURL = push.repository.clone_url //Clone URL
  //let pushBranch = push.ref.slice(11); //Get target branch name
  let tagName = push.ref.split("/").pop();
  let created = push.created;
  let repoName = push.repository.name;
  let secret = req.headers["x-hub-signature"]
    ? req.headers["x-hub-signature"].slice(5)
    : null;

  findTriggers(
    push,
    validatePTT,
    { tagName, created, repoName, secret },
    req,
    res
  );
}

async function validatePTT(trigger, { tagName, created, repoName, secret }) {
  const triggerRepoName = trigger.params.find((o) => o.name === "REPO_NAME");
  const triggerSecret = trigger.params.find((o) => o.name === "SECRET");
  const triggerTagPattern = trigger.params.find(
    (o) => o.name === "TAG_PATTERN"
  );

  /**
   * Make sure that it is a tag created and NOT deleted
   */
  if (!created) {
    throw "Tag is deleted";
  }
  /**
   * Check if the Repo URL is provided (else consider as ANY)
   * Check that the Repo URL is the same as provided by the Trigger and if not provided
   */
  if (triggerRepoName.value && repoName !== triggerRepoName.value) {
    throw "Repo do not match";
  }

  if (triggerTagPattern.value && !minimatch(tagName, triggerTagPattern.value)) {
    throw "Tag do not match";
  }

  /**
   * verify signature
   */
  return verifySignature(secret, triggerSecret.value);
}

module.exports = controller;
