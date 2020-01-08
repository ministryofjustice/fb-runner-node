require('@ministryofjustice/module-alias/register-module')(module)

const path = require('path')
const configureModules = require('./configure/sources-configure-modules')

const CommonError = require('~/fb-runner-node/error')

class ServerError extends CommonError {}

const configureSources = async (options = {}) => {
  const {
    APP_DIR,
    RUNNER_DIR,
    SERVICE_PATH
  } = options

  if (!SERVICE_PATH) {
    throw new ServerError({
      code: 'ENOSERVICEPATH',
      message: 'No SERVICE_PATH was provided'
    })
  }

  const resolvedServicePath = path.resolve(process.env.PWD, SERVICE_PATH)
  const serviceConfigPath = path.join(resolvedServicePath, 'metadata/config')

  let serviceSources = []

  serviceSources.push({
    source: 'govuk-frontend',
    sourcePath: path.resolve(process.env.PWD, 'node_modules/govuk-frontend/govuk')
  })

  serviceSources.push({
    source: '@ministryofjustice/fb-components',
    sourcePath: path.resolve(process.env.PWD, 'node_modules/@ministryofjustice/fb-components')
  })

  serviceSources.push({
    source: 'app',
    sourcePath: APP_DIR
  })

  serviceSources.push({
    source: 'service',
    sourcePath: resolvedServicePath
  })

  const moduleSources = configureModules(serviceConfigPath, RUNNER_DIR)
  serviceSources = serviceSources.concat(moduleSources)

  return {
    serviceSources
  }
}

module.exports = configureSources
