const path = require('path')
const loadJson = require('load-json-file').sync

const preinstallSources = require('./sources-preinstall')
const installSources = require('./sources-install')
const configureDependencies = require('./configure/sources-configure-dependencies')
const configureModules = require('./configure/sources-configure-modules')

const {FBError} = require('@ministryofjustice/fb-utils-node')
class FBServerError extends FBError {}

const configureSources = async (options = {}) => {
  const {
    APP_DIR,
    RUNNER_DIR,
    PLATFORM_ENV,
    COMPONENTS_MODULE,
    COMPONENTS_VERSION,
    SERVICE_PATH
  } = options

  if (!SERVICE_PATH) {
    throw new FBServerError({
      code: 'ENOSERVICEPATH',
      message: 'No value for SERVICEPATH (path to service metadata) provided'
    })
  }
  const resolvedServicePath = path.resolve(process.env.PWD, SERVICE_PATH)

  const servicePackagePath = path.join(resolvedServicePath, 'package.json')
  const servicePackageLockPath = path.join(resolvedServicePath, 'package-lock.json')
  const serviceNodeModulesPath = path.join(resolvedServicePath, 'node_modules')
  const serviceConfigPath = path.join(resolvedServicePath, 'metadata', 'config')

  // Perform any necdessary tasks before installing dependencies
  await preinstallSources({
    PLATFORM_ENV,
    COMPONENTS_MODULE,
    COMPONENTS_VERSION,
    servicePackagePath,
    serviceConfigPath,
    servicePackageLockPath,
    serviceNodeModulesPath,
    resolvedServicePath
  })

  // Install dependencies
  installSources(resolvedServicePath)

  // Dettermine sources from installed dependencies
  let serviceSources = configureDependencies(servicePackagePath, serviceNodeModulesPath)

  // Add app and service paths
  serviceSources.push({
    source: 'app',
    sourcePath: APP_DIR
  })
  serviceSources.push({
    source: 'service',
    sourcePath: resolvedServicePath
  })

  // Load modules config
  const moduleSources = configureModules(serviceConfigPath, RUNNER_DIR)
  serviceSources = serviceSources.concat(moduleSources)

  // Extract govuk-frontend version
  // and perform any needed manipulation of source directory
  let govukFrontendVersion
  serviceSources = serviceSources.map(sourceObj => {
    const {source, sourcePath} = sourceObj
    if (source === 'govuk-frontend') {
      govukFrontendVersion = loadJson(path.join(sourcePath, 'package.json')).version
      if (parseInt(govukFrontendVersion, 10) >= 3) {
        sourceObj.sourcePath = path.join(sourcePath, 'govuk')
      }
    }
    return sourceObj
  })

  return {
    serviceSources,
    locals: {
      govuk_frontend_version: govukFrontendVersion
    }
  }
}

module.exports = configureSources
