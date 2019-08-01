const configureSources = require('./sources/sources-configure')
const loadSources = require('./sources/sources-load')
const configureMiddleware = require('./server-middleware')

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

module.exports = initRunner
