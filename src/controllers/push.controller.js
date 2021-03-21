const minimatch = require("minimatch");
const { findTriggers } = require("../helpers");

function controller(req, res) {
  // get ref type which indicates push type, and pushName which is the name of the tag/branch
  const [_temp, refType, pushName] = req.body.ref.split("/");
  // get the push type from ref type
  const pushType = refType === "heads" ?  "branch" : 
                    refType === "tags"  ?  "tag"    : "";
  if (pushType === "") throw("no mathchig push type");
  // search for any triggers that listen to the webhookPush method
  findTriggers(
    createValidateFunc(pushType),
    [ pushName ],
    req, res,
    "webhookPush",
    `${pushType} push: ${pushName}`
  );
}

function createValidateFunc(pushType){
  return (trigger, [ pushName ]) => {
    const paramName = `${pushType}Pat`;
    const triggerPattern = (trigger.params.find((o) => o.name === paramName).value || "").trim();

    // Check that the branch provided matches the request. If not provided consider as any.
    if (triggerPattern && !minimatch(pushName, triggerPattern)) {
      throw `Not matching ${pushType} pattern`;
    }
  }
}

module.exports = controller;
