'use strict'

require('module-alias/register')

const express = require('express')

const configureMonitoring = require('./server-monitoring')
const initRunner = require('./server-init')
const listenServer = require('./server-listen')

const {FBLogger} = require('@ministryofjustice/fb-utils-node')
FBLogger.verbose(true)

const CONSTANTS = require('~/fb-runner-node/constants/constants')

const start = async (options = {}) => {
  options = Object.assign({}, CONSTANTS, options)

  // Create express server
  const app = express()
  // Unset public announcement of express
  app.disable('x-powered-by')
  // Set views engine
  app.set('view engine', 'html')

  configureMonitoring(app, options)

  const router = await initRunner(app, options)
  app.use(router)

  await listenServer(app, options)
}

module.exports = {
  start,
  initRunner
}
