const path = require('path')
process.env.APP_DIR = path.resolve(__dirname, '..')

const server = require('../lib/server/server')

server.start()
