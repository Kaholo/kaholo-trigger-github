const crypto = require("crypto");
const micromatch = require("micromatch");

function verifySignature(triggersSecret, requestsSecret, body) {
  if (!triggersSecret) {
    return true;
  }

  if (!requestsSecret) {
    return false;
  }

  const hash = crypto.createHmac("sha256", triggersSecret)
    .update(JSON.stringify(body))
    .digest("hex");

  // strip "sha256=" off the beginning
  return hash === requestsSecret.substring(7);
}

function matches(value, pattern) {
  return !pattern || micromatch.isMatch(value, pattern);
}

module.exports = {
  verifySignature,
  matches,
};
