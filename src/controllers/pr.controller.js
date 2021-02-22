const minimatch = require(`minimatch`);
const { verifySignature, findTriggers } = require(`../helpers`);

function controller(req, res) {
  let body = req.body;

  if (!body.repository) {
    console.log(`Repo not found`);
    return res.send(`repo not found`);
  }

  let repoName = body.repository.name; //Github repository name
  let targetBranch = body.pull_request.base.ref; //Get target branch name
  let sourceBranch = body.pull_request.head.ref; //Get source branch name
  let actionType = body.action;
  let secret = req.headers[`x-hub-signature`]
    ? req.headers[`x-hub-signature`].slice(5)
    : null;
  let merged = body.pull_request.merged;
  findTriggers(
    body,
    validateTriggerPR,
    { repoName, targetBranch, sourceBranch, secret, actionType, merged },
    req,
    res,
    `webhookPR`
  );
}

async function validateTriggerPR(trigger,{ repoName, targetBranch, sourceBranch, secret, actionType, merged }) {
  const triggerRepoName = (trigger.params.find((o) => o.name === `repoName`).value || "").trim();
  const toBranch = (trigger.params.find((o) => o.name === `toBranch`).value || "").trim();
  const fromBranch = (trigger.params.find((o) => o.name === `fromBranch`).value || "").trim();
  const triggerSecret = (trigger.params.find((o) => o.name === `secret`).value || "").trim();
  const triggerActionType = trigger.params.find((o) => o.name === `actionType`).value || `any`;
  /**
   * Check if the Repo URL is provided (else consider as ANY)
   * Check that the Repo URL is the same as provided by the Trigger and if not provided
   */
  if (triggerRepoName && repoName !== triggerRepoName) {
    throw `Not same repo`;
  }

  // Check that To branch provided - else - consider as any.
  if (toBranch && !minimatch(targetBranch, toBranch)) {
    throw `Not matching target branch`;
  }

  // Check that From branch provided - else - consider as any.
  if (fromBranch && !minimatch(sourceBranch, fromBranch)) {
    throw `Not matching target branch`;
  }
  
  // Check that action type is the same as request
  switch(triggerActionType){
    case `opened`:
      if (actionType !== `opened`) {
        throw `Not matching action type. excpected opened.`;
      }
      break;
    case `merged`:
      if (actionType !== `closed` || !merged){
        throw `Not matching action type. excpected closed AND merged.`;
      }
      break;
    case `declined`:
      if (actionType !== `closed` || merged){
        throw `Not matching action type. excpected closed AND not merged.`;
      }
      break;
    case `any`:
      break;
  }

  // Verify signature
  return verifySignature(secret, triggerSecret);
}

module.exports = controller;
