require('module-alias/register')

const path = require('path')
process.env.APP_DIR = path.resolve(__dirname, '..')

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
