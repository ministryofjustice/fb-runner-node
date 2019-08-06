const path = require('path')
process.env.APP_DIR = path.resolve(__dirname, '..')

const start = async () => {
  try {
    const server = require('../lib/server/server')
    await server.start()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e)
    process.exit(1)
  }
}
start()
