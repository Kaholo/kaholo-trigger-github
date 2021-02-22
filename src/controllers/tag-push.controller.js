const minimatch = require("minimatch");
const { verifySignature, findTriggers } = require("../helpers");


function controller(req, res) {
  let push = req.body;

  if (!push.repository) {
    console.log("Repo not found");
    return res.send("repo not found");
  }

  let tagName = push.ref.split("/").pop();
  let created = push.created;
  let repoName = push.repository.name;
  let secret = req.headers["x-hub-signature"]
    ? req.headers["x-hub-signature"].slice(5)
    : null;

  findTriggers(
    push,
    validatePT,
    { tagName, created, repoName, secret },
    req,
    res,
    "webhookPushTag"
  );
}

async function validatePT(trigger, { tagName, created, repoName, secret }) {
  const triggerRepoName = (trigger.params.find((o) => o.name === "repoName").value || "").trim();
  const triggerSecret = (trigger.params.find((o) => o.name === "secret").value || "").trim();
  const triggerTagPattern = (trigger.params.find((o) => o.name === "tagPat").value || "").trim();

  // Make sure that it is a tag created and NOT deleted
  if (!created) {
    throw "Tag is deleted";
  }
  // Check if the Repo Name is provided (else consider as ANY)
  if (triggerRepoName && triggerRepoName !== repoName) {
    throw "Repo do not match";
  }

  if (triggerTagPattern && !minimatch(tagName, triggerTagPattern)) {
    throw "Tag do not match";
  }

  // Verify signature
  return verifySignature(secret, triggerSecret);
}

module.exports = controller;
