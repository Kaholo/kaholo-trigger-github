const minimatch = require(`minimatch`);
const {findTriggers} = require(`../helpers`);

function controller(req, res) {
  const body = req.body;

  const targetBranch = body.pull_request.base.ref; //Get target branch name
  const sourceBranch = body.pull_request.head.ref; //Get source branch name
  const merged = body.pull_request.merged;
  let actionType = body.action;
  
  if (actionType === "closed"){
    actionType = merged ? "merged" : "declined";
  }
  
findTriggers(
    validateTriggerPR,
    [ targetBranch, sourceBranch, actionType ],
    req, res,
    `webhookPR`
  );
}

function validateTriggerPR(trigger,[ targetBranch, sourceBranch, actionType ]) {
  const toBranch = (trigger.params.find((o) => o.name === `toBranch`).value || "").trim();
  const fromBranch = (trigger.params.find((o) => o.name === `fromBranch`).value || "").trim();
  const triggerActionType = trigger.params.find((o) => o.name === `actionType`).value || `any`;

  // Check that To branch provided is same as request. If not provided consider as any.
  if (toBranch && !minimatch(targetBranch, toBranch)) {
    throw `Not matching target branch`;
  }

  // Check that From branch provided is same as request. If not provided consider as any.
  if (fromBranch && !minimatch(sourceBranch, fromBranch)) {
    throw `Not matching target branch`;
  }
  
  // Check that action type provided is same as request. If not provided consider as any.
  if (triggerActionType !== "any" && triggerActionType !== actionType){
    throw "Not matching action type";
  }
}

module.exports = controller;
