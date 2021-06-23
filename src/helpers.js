const crypto = require("crypto");
const minimatch = require("minimatch")

function verifyRepoName(trigger, repoName){
  const triggerRepoName = (trigger.params.repoName || "").trim();
  return !triggerRepoName || minimatch(repoName, triggerRepoName);
}

function verifySignature(trigger, secret, body) {
  const triggerSecret = (trigger.params.secret || "").trim();
  if (!triggerSecret){
    return !secret;
  }
  const hash = crypto.createHmac("sha256", triggerSecret).update(JSON.stringify(body)).digest("hex");
  return hash === secret; 
}

module.exports = {
  verifyRepoName,
  verifySignature
};
