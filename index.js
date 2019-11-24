require('module-alias')(__dirname)

const server = require('~/fb-runner-node/server/server')

module.exports = server.start()
