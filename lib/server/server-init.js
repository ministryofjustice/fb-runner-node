const configureSources = require('./sources/sources-configure')
const loadSources = require('./sources/sources-load')
const getRouter = require('./server-router')

const initRunner = async (app, options = {}) => {
  const {
    serviceSources,
    locals
  } = await configureSources(options)

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

  return getRouter(app, options)
}

module.exports = initRunner
