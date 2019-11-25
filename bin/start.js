const path = require('path')
const init = require('@ministryofjustice/module-alias')

const APP_DIR = path.resolve(__dirname, '..')

process.env.APP_DIR = APP_DIR

init(APP_DIR)

const start = async () => {
  try {
    const server = require('~/fb-runner-node/server/server')
    await server.start()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e)
    process.exit(1)
  }
}
start()
