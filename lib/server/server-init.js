require('@ministryofjustice/module-alias/register-module')(module)

const configureSources = require('./sources/sources-configure')
const loadSources = require('./sources/sources-load')
const nunjucksConfiguration = require('~/fb-runner-node/middleware/nunjucks-configuration/nunjucks-configuration')
const getRouter = require('./server-router')

module.exports = async function initRunner (app, options = {}) {
  const {
    serviceSources
  } = await configureSources(options)

  const {
    schemas,
    serviceData
  } = await loadSources(serviceSources, options)

  nunjucksConfiguration.init(app, serviceSources, options)

  return getRouter(
    Object.assign(options, { schemas, serviceData, serviceSources })
  )
}
