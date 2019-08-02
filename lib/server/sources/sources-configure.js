const path = require('path')
const {
  existsSync,
  writeFileSync
} = require('fs')
const {execSync} = require('child_process')
const isOnline = require('is-online')
const loadJson = require('load-json-file').sync

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
  const serviceGitIgnorePath = path.join(resolvedServicePath, '.gitignore')
  const serviceNodeModulesPath = path.join(resolvedServicePath, 'node_modules')
  const serviceConfigPath = path.join(resolvedServicePath, 'metadata', 'config')

  const servicePackageExists = existsSync(servicePackagePath)
  if (!servicePackageExists) {
    // Create package.json with default components dependencies
    const defaultPackage = `
{
  "dependencies": {
    "${COMPONENTS_MODULE}": "${COMPONENTS_VERSION}"
  }
}
`
    writeFileSync(servicePackagePath, defaultPackage)

    // update service config if needed
    // NB. this can be removed once https://github.com/ministryofjustice/fb-service-starter/pull/2 has been merged
    const serviceConfigFilePath = path.join(serviceConfigPath, 'service.json')
    const serviceConfig = loadJson(serviceConfigFilePath)
    if (!serviceConfig._isa) {
      serviceConfig._isa = `${COMPONENTS_MODULE}=>service`
      writeFileSync(serviceConfigFilePath, JSON.stringify(serviceConfig, null, 2))
    }
  }

  // Ensure that a sensible .gitignore file exists
  if (!existsSync(serviceGitIgnorePath)) {
    const defaultGitIgnore = `
node_modules
.DS_Store
package.json
package-lock.json
`
    writeFileSync(serviceGitIgnorePath, defaultGitIgnore)
  }

  // ensure that any auto-generated package files are deleted whatever happens
  let cleanupPackage = () => {}
  if (!servicePackageExists) {
    cleanupPackage = () => {
      try {
        execSync(`rm ${servicePackagePath} && rm ${servicePackageLockPath}`)
      } catch (e) {
        //
      }
    }
  }

  if (!PLATFORM_ENV) {
    let online
    try {
      online = await isOnline()
    } catch (e) {
    //
    }
    const hasServiceNoduleModules = existsSync(serviceNodeModulesPath)
    // do not delete previously installed service node_modules if defined in an existing package.json
    if (hasServiceNoduleModules && online && !servicePackageExists) {
      execSync(`rm -rf ${serviceNodeModulesPath}`)
    } else if (!hasServiceNoduleModules && !online) {
      // no service node_modules and no internet connection is a brick wall
      // TODO: stash fb-components-core locally and copy that if defaulting to latest
      throw new FBServerError({
        code: 'ENOINSTALLDEPENDENCIES',
        message: `${SERVICE_PATH} does not have its dependencies installed and there is no internet connection`
      })
    }
  }

  try {
    execSync(`cd ${resolvedServicePath} && npm install`)
  } catch (e) {
    cleanupPackage()
    throw e
  }

  const servicePackage = loadJson(servicePackagePath)
  const servicePackageLock = loadJson(servicePackageLockPath)
  const serviceDependencies = Object.keys(servicePackage.dependencies)
  const serviceLockDependencies = servicePackageLock.dependencies

  cleanupPackage()

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
