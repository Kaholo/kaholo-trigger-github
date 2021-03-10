const crypto = require("crypto");
const config = require("./config");
const mapExecutionService = require("../../../api/services/map-execution.service");
const Trigger = require("../../../api/models/map-trigger.model");

function findTriggers(validatationFn, startParams, req, res, method) {7
  // Get Data that is the same for all github webhook payloads
  const body = req.body;
  if (!body.repository) {
    res.send("Repo not found");
    throw "Repo not found";
  }
  const repoName = body.repository.name; //Github repository name
  console.error(req.headers["x-hub-signature-256"]);
  const secret = req.headers["x-hub-signature-256"]
    ? req.headers["x-hub-signature-256"].slice(7)
    : null;
  // find triggers that match the request
  Trigger.find({ plugin: config.name, method: method })
    .then((triggers) => {
      console.log(`Found ${triggers.length} triggers`);
      res.send("OK");
      triggers.forEach((trigger) => {
        try {
          verifyRepoName(trigger, repoName);
          verifySignature(trigger, secret, body);
          validatationFn(trigger, startParams);
          exec(trigger, body, req.io);
        }
        catch (err){
          console.error(err);
        }
      });
    })
    .catch((error) => res.send(error));
}

function exec(trigger, body, io) {
  console.log(trigger.map);
  let message = trigger.name + " - Started by Github trigger";
  console.log(`******** Github: executing map ${trigger.map} ********`);
  mapExecutionService.execute(
    trigger.map,
    null,
    io,
    { config: trigger.configuration },
    message,
    body
  );
}

function verifyRepoName(trigger, repoName){
  const triggerRepoName = (trigger.params.find((o) => o.name === "repoName").value || "").trim();
  if (triggerRepoName && triggerRepoName !== repoName){
    throw "Not same repo";
  }
}

function verifySignature(trigger, secret, body) {
  const triggerSecret = (trigger.params.find((o) => o.name === "secret").value || "").trim();

  if (secret) {
    if (!triggerSecret){
      throw "Secret was expected yet none provided by trigger";
    }
    const hash = crypto.createHmac("sha256", triggerSecret).update(JSON.stringify(body)).digest("hex");
    if (hash !== secret){
      throw "Secrets do not match";
    }
  } 
  else if (triggerSecret) {
    throw "Secret was provided by trigger, but not provided by github";
  }
}

module.exports = {
  findTriggers
};
