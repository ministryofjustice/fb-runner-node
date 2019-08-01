'use strict'

const express = require('express')

const configureMonitoring = require('./server-monitoring')
const initRunner = require('./server-init')
const startRunner = require('./server-start')

const {FBLogger} = require('@ministryofjustice/fb-utils-node')
FBLogger.verbose(true)

const CONSTANTS = require('../constants/constants')

const start = async (options = {}) => {
  options = Object.assign({}, CONSTANTS, options)
  // Create express server
  const app = express()

  configureMonitoring(app, options)

  const router = await initRunner(app, options)
  app.use(router)

  await startRunner(app, options)
}

module.exports = {
  start,
  initRunner
}
