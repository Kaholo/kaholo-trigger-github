const crypto = require("crypto");
const minimatch = require("minimatch")

function verifyRepoName(trigger, repoName){
  const triggerRepoName = (trigger.params.repoName || "").trim();
  return !triggerRepoName || minimatch(repoName, triggerRepoName);
}

function verifySignature(trigger, secret, body) {
  const triggerSecret = (trigger.params.secret || "").trim();
  if (!triggerSecret) return true;
  const hash = crypto.createHmac("sha256", triggerSecret).update(JSON.stringify(body)).digest("hex");
  return hash === secret.substring(7);  // secret="sha256=<secret>"
}

module.exports = {
  verifyRepoName,
  verifySignature
};
