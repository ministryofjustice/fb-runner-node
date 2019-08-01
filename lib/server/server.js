'use strict'

const express = require('express')

const configureMetrics = require('./server.metrics')
const configureSources = require('./sources/sources-configure')
const loadSources = require('./sources/sources-load')
const configureMiddleware = require('./server.middleware')
const startRunner = require('./server.start')

const {FBLogger} = require('@ministryofjustice/fb-utils-node')
FBLogger.verbose(true)

const CONSTANTS = require('../constants/constants')

const initRunner = async (app, options = {}) => {
  const {
    serviceSources,
    locals
  } = await configureSources(app, options)

  const {
    schemas,
    serviceData
  } = await loadSources(serviceSources, options)

  options = Object.assign(options, {
    schemas,
    serviceData,
    serviceSources,
    locals
  })

  const runnerRouter = await configureMiddleware(app, options)
  return runnerRouter
}

const start = async (options = {}) => {
  options = Object.assign({}, CONSTANTS, options)
  // Create express server
  const app = express()

  configureMetrics(app, options)

  const router = await initRunner(app, options)
  app.use(router)

  await startRunner(app, CONSTANTS.PORT, options)
}

module.exports = {
  start,
  initRunner
}
