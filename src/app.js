const crypto = require('crypto');
const config = require("./config")


module.exports = {
	webhook: function (req, res) {
		let triggerPlugin;
		let push = req.body;
		let url = push.repository.clone_url;
		let branch = push.ref.slice(11); // get only the branch name
		let signature = req.headers["x-hub-signature"] ? req.headers["x-hub-signature"].slice(5) : null;
		let p = new Promise((resolve, reject) => {
			PluginService.getPlugin({
				name: config.name
			}).then((plugin) => {
				if (!plugin || !plugin.active) {
					reject("Plugin is not active");
				}
				triggerdPlugin = plugin;
				resolve(MapTrigger.find({
					plugin: plugin.id
				}).populate("method"));
			})
		}).then((triggers) => {
			triggers.forEach(trigger => new Promise((resolve, reject) => {
				console.log(trigger.params);
				if (url !== trigger.params.REPO_URL.value) {
					reject("Not same repo");
				}
				if (signature && !trigger.params.SECRET) {
					reject("Secret was expected yet none provided");
				} else if (signature && trigger.params.SECRET.value) {
					const hmac = crypto.createHmac('SHA1', trigger.params.SECRET.value);
					hmac.on('readable', () => {
						const data = hmac.read();
						if (data) {
							let hash = data.toString('hex');
							if (!(hash === signature)) {
								reject("The signature doesn't match the trigger's secret");
							} else {
								resolve()
							}
						}
					});
					hmac.write(JSON.stringify(push));
					hmac.end();

				} else if (!signature && trigger.params.SECRET.value) {
					reject("Signature was expected, yet none provided");
				} else if (!signature && !trigger.params.SECRET.value) {
					resolve();
				} else {
					reject("Unhandled error occured");
				}
			}).then(() => {
				return MapService.executeMap("-1", trigger.map, 0, 0)
			}).then((result) => {
				console.log("Finish runnig map");
				res.ok();
			}).catch((error) => {
				console.log("Error during calling trigger", error);
				res.badRequest();
			}))
		}).catch((error) => {
			console.log("Error running trigger", error);
			res.badRequest();
		})
	},

}