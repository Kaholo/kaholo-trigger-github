const minimatch = require("minimatch");
const { findTriggers } = require("../helpers");

function controller(req, res) {
  const [_temp, refType, branchName] = req.body.ref.split("/");

  if (refType != "heads"){
    res.send("Not a branch push");
    throw "Not a branch push";
  }

  findTriggers(
    validateTriggerPush,
    [ branchName ],
    req, res,
    "webhookPush"
  );
}

function validateTriggerPush(trigger, [ branchName ]) {
  const triggerBranchPat = (trigger.params.find((o) => o.name === "branchPat").value || "").trim();

  // Check that the branch provided matches the request. If not provided consider as any.
  if (triggerBranchPat && !minimatch(branchName, triggerBranchPat)) {
    throw "Not matching pushed branch";
  }
}

module.exports = controller;
