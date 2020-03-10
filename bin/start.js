require('@ministryofjustice/module-alias/register-module')(module)
const server = require('~/fb-runner-node/server/server')

const debug = require('debug')
const log = debug('runner:start:log')
const error = debug('runner:start:error')

async function start () {
  log('Runner starting ...')

  try {
    await server.start()

    log('... Done')
  } catch ({ message }) {
    error(message)

    process.exit(1)
  }
}

module.exports = start()
