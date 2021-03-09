const minimatch = require("minimatch");
const { verifySignature, findTriggers, getPushParams } = require("../helpers");

function controller(req, res) {
  const {refType, branch, repoName, secret} = getPushParams(req, res);

  if (refType != "heads"){
    res.send("Not a branch push");
    throw "Not a branch push";
  }

  findTriggers(
    validateTriggerPush,
    { repoName, branch, secret },
    req, res,
    "webhookPush"
  );
}

async function validateTriggerPush(trigger, { repoName, branch, secret }) {
  const triggerRepoName = (trigger.params.find((o) => o.name === "repoName").value || "").trim();
  const triggerBranchPat = (trigger.params.find((o) => o.name === "branchPat").value || "").trim();
  const triggerSecret = (trigger.params.find((o) => o.name === "secret").value || "").trim();
  // Check that repo name matches in case it was provided. Else consider as any
  if (triggerRepoName && repoName !== triggerRepoName) {
    throw "Not same repo";
  }

  // Check that To branch provided. Else consider as any.
  if (triggerBranchPat && !minimatch(branch, triggerBranchPat)) {
    throw "Not matching pushed branch";
  }

  // Verify the signature
  return verifySignature(secret, triggerSecret);
}

module.exports = controller;
