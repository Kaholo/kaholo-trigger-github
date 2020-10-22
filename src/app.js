module.exports = {
    webhookPush: require('./controllers/push.controller'),
    webhookPushTag: require('./controllers/tag-push.controller'),
    webhookPR: require('./controllers/pr.controller')
}