const minimatch = require("minimatch");
const { findTriggers } = require("../helpers");


function controller(req, res) {
  const [_temp, refType, tagName] = req.body.ref.split("/");
  
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
    { tagName },
    req, res,
    "webhookPushTag"
  );
}

function validatePT(trigger, { tagName }) {
  const triggerTagPattern = (trigger.params.find((o) => o.name === "tagPat").value || "").trim();

  // check that tag name matches in case it was provided. Else consider as any.
  if (triggerTagPattern && !minimatch(tagName, triggerTagPattern)) {
    throw "Tag do not match";
  }
}

module.exports = controller;
