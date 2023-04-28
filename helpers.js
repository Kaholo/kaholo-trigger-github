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
    .update(typeof body === "string"
      ? body
      : JSON.stringify(body))
    .digest("hex");

  // strip "sha256=" off the beginning
  return hash === requestsSecret.substring(7);
}

function matches(value, pattern) {
  return !pattern || micromatch.isMatch(value, pattern);
}

function extractData(req) {
  let rawData = null;
  let data = null;
  switch (req.headers["content-type"]) {
    case "application/json":
      rawData = req.body;
      data = req.body;
      break;
    case "application/x-www-form-urlencoded":
      rawData = req.rawBody;
      data = JSON.parse(req.body.payload);
      break;
    default:
      throw new Error(`Unsupported 'content-type' header. Received: ${req.headers["content-type"]}`);
  }

  return [rawData, data];
}

module.exports = {
  verifySignature,
  matches,
  extractData,
};
