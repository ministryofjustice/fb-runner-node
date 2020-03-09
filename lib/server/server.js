'use strict'

require('@ministryofjustice/module-alias/register-module')(module)

const express = require('express')
const debug = require('debug')

const configureMonitoring = require('./server-monitoring')
const initRunner = require('./server-init')
const listenServer = require('./server-listen')

const CONSTANTS = require('~/fb-runner-node/constants/constants')

const log = debug('runner:server')

const start = async (options = {}) => {
  log('Runner is awake')

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
