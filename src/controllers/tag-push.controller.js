  const minimatch = require("minimatch");
const { verifySignature, findTriggers, getPushParams } = require("../helpers");


function controller(req, res) {
  const {refType, tagName, repoName, secret} = getPushParams(req, res);
  
  if (refType != "tags"){
    res.send("Not a tag push");
    throw "Not a tag push";
  }
  // Make sure that it is a tag created and NOT deleted
  if (!req.body.created) {
    res.send("Tag is deleted");
    throw "Tag is deleted";
  }

  findTriggers(
    validatePT,
    { tagName, repoName, secret },
    req, res,
    "webhookPushTag"
  );
}

async function validatePT(trigger, { tagName, repoName, secret }) {
  const triggerRepoName = (trigger.params.find((o) => o.name === "repoName").value || "").trim();
  const triggerSecret = (trigger.params.find((o) => o.name === "secret").value || "").trim();
  const triggerTagPattern = (trigger.params.find((o) => o.name === "tagPat").value || "").trim();

  // Check if the Repo Name is provided (else consider as ANY)
  if (triggerRepoName && triggerRepoName !== repoName) {
    throw "Repo do not match";
  }
  // check that tag name matches in case it was provided. Else consider as any.
  if (triggerTagPattern && !minimatch(tagName, triggerTagPattern)) {
    throw "Tag do not match";
  }

  // Verify signature
  return verifySignature(secret, triggerSecret);
}

module.exports = controller;
