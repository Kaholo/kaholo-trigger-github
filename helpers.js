const crypto = require("crypto");
const micromatch = require("micromatch");

function verifyRepoName(trigger, repoName){
  const repoNamePattern = (trigger.params.repoName || "").trim();
  return isMatch(repoName, repoNamePattern);
}

function verifySignature(trigger, secret, body) {
  const triggerSecret = (trigger.params.secret || "").trim();
  if (!triggerSecret) return true;
  const hash = crypto.createHmac("sha256", triggerSecret).update(JSON.stringify(body)).digest("hex");
  if (!secret) return false;
  return hash === secret.substring(7);  // secret="sha256=<secret>"
}

function isMatch(value, pattern){
  return !pattern || micromatch.isMatch(value, pattern);
}

module.exports = {
  verifyRepoName,
  verifySignature,
  isMatch
};
