const crypto = require("crypto");
const config = require("./config");
const mapExecutionService = require("../../../api/services/map-execution.service");
const Trigger = require("../../../api/models/map-trigger.model");

function findTriggers(validatationFn, startParams, req, res, method) {
  Trigger.find({ plugin: config.name, method: method })
    .then((triggers) => {
      console.log(`Found ${triggers.length} triggers`);
      res.send("OK");
      triggers.forEach((trigger) => {
        validatationFn(trigger, startParams)
          .then(exec(trigger, req.body, req.io))
          .catch(console.error);
      });
    })
    .catch((error) => res.send(error));
}

function exec(trigger, body, io) {
  return () => {
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
  };
}

async function verifySignature(secret, triggerSecret) {
  if (secret && !triggerSecret) {
    throw "Secret was expected yet none provided";
  } else if (secret && triggerSecret) {
    return new Promise((resolve, reject) => {
      const hmac = crypto.createHmac("SHA1", triggerSecret);
      hmac.on("readable", () => {
        const data = hmac.read();
        if (data) {
          let hash = data.toString("hex");
          if (!(hash === secret)) {
            reject("The signature doesn't match the trigger's secret");
          } else {
            resolve();
          }
        }
      });
    });
  }
}

function getPushParams(req, res){
  const push = req.body;

  if (!push.repository) {
    res.send("Repo not found");
    throw "Repo not found";
  }

  const [ _temp, refType, refName ] = push.ref.split("/"); // get ref type, and tag name
  const repoName = push.repository.name;
  const secret = req.headers["x-hub-signature"]
    ? req.headers["x-hub-signature"].slice(5)
    : null;

  return {refType, refName, repoName, secret};
}

module.exports = {
  findTriggers,
  verifySignature,
  getPushParams
};
