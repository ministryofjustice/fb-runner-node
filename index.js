require('@ministryofjustice/module-alias/register')

const server = require('~/fb-runner-node/server/server')

module.exports = server.start()
