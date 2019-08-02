const path = require('path')
const loadJson = require('load-json-file').sync

const preinstallSources = require('./sources-preinstall')
const installSources = require('./sources-install')
const configureModules = require('./sources-configure-modules')

const {FBLogger, FBError} = require('@ministryofjustice/fb-utils-node')
class FBServerError extends FBError {}

const configureSources = async (app, options = {}) => {
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

  installSources(resolvedServicePath)

  const servicePackage = loadJson(servicePackagePath)
  const servicePackageLock = loadJson(servicePackageLockPath)
  const serviceDependencies = Object.keys(servicePackage.dependencies)
  const serviceLockDependencies = servicePackageLock.dependencies

  process.emit('cleanup')

  // Recursively determine service dependencies by inspecting package-lock entries
  let serviceSources = []
  const addDependencies = (deps) => {
    serviceSources = serviceSources.concat(deps)
    deps.forEach(dep => {
      const entry = serviceLockDependencies[dep]
      if (entry.requires) {
        const requiredDeps = Object.keys(entry.requires)
        addDependencies(requiredDeps)
      }
    })
  }
  addDependencies(serviceDependencies)

  // Determine actual locations of service dependencies
  serviceSources = serviceSources.map(source => {
    const sourceEnvVar = `MODULE__${source}`.replace(/@/g, '').replace(/[-/]/g, '_')
    const sourceEnvVarValue = process.env[sourceEnvVar]
    const sourcePath = sourceEnvVarValue || path.join(serviceNodeModulesPath, source)
    if (sourceEnvVarValue) {
      FBLogger('Overriding components module', {sourceEnvVar, sourcePath})
    }
    return {
      source,
      sourcePath
    }
  }).reverse()

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

  // Load modules config
  serviceSources = configureModules(serviceSources, serviceConfigPath, RUNNER_DIR)

  // Add app and service paths
  serviceSources.push({
    source: 'app',
    sourcePath: APP_DIR
  })
  serviceSources.push({
    source: 'service',
    sourcePath: resolvedServicePath
  })

  return {
    serviceSources,
    locals: {
      govuk_frontend_version: govukFrontendVersion
    }
  }
}

module.exports = configureSources
