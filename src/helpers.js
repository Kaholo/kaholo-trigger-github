const crypto = require("crypto");
const config = require("./config");
const mapExecutionService = require("../../../api/services/map-execution.service");
const Trigger = require("../../../api/models/map-trigger.model");

function findTriggers(body, validatationFn, startParams, req, res) {
  Trigger.find({ plugin: config.name })
    .then((triggers) => {
      console.log(`Found ${triggers.length} triggers`);
      res.send("OK");
      triggers.forEach((trigger) => {
        validatationFn(trigger, startParams)
          .then(exec(trigger, body, req.io))
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

module.exports = {
  findTriggers,
  verifySignature,
};
