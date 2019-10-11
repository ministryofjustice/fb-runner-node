const configureSources = require('./sources/sources-configure')
const loadSources = require('./sources/sources-load')
const nunjucksConfiguration = require('../middleware/nunjucks-configuration/nunjucks-configuration')
const getRouter = require('./server-router')

const initRunner = async (app, options = {}) => {
  const {
    serviceSources
  } = await configureSources(options)

  const locals = {govuk_frontend_version: '3.1.0'}

  const {
    schemas,
    serviceData
  } = await loadSources(serviceSources, options)

  nunjucksConfiguration.init(app, serviceSources, options)

  options = Object.assign(options, {
    schemas,
    serviceData,
    serviceSources,
    locals
  })

  return getRouter(options)
}

module.exports = initRunner
