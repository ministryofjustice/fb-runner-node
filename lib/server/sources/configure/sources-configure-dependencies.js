require('@ministryofjustice/module-alias/register-module')(module)

const debug = require('debug')
const log = debug('runner:sources-configure-dependencies')

debug.enable('runner:*')

const path = require('path')
const {
  sync: loadJsonFile
} = require('load-json-file')

const CommonError = require('~/fb-runner-node/error')

class DependencyError extends CommonError {}

function configureDependencies (servicePackagePath, serviceModulesPath) {
  const servicePackage = loadJsonFile(servicePackagePath)

  // Recursively determine service dependencies
  let serviceSources = []
  const versionCheck = {}

  function addDependencies (dependencies) {
    const deps = Object.keys(dependencies)
    serviceSources = serviceSources.concat(deps)
    deps.forEach((dep) => {
      const version = dependencies[dep]
      if (versionCheck[dep] && versionCheck[dep] !== version) {
        throw new DependencyError(`Different versions of ${dep} found: ${version} / ${versionCheck[dep]}`)
      }

      versionCheck[dep] = version

      const depPackagePath = path.join(serviceModulesPath, dep, 'package.json')
      const depPackage = loadJsonFile(depPackagePath)
      if (depPackage.dependencies) {
        addDependencies(depPackage.dependencies)
      }
    })
  }

  addDependencies(servicePackage.dependencies)

  // Remove duplicates
  serviceSources = [...new Set(serviceSources)]

  // Reverse order
  serviceSources = serviceSources.reverse()

  // Determine actual locations of service dependencies
  serviceSources = serviceSources.map(source => {
    const sourcePath = path.join(serviceModulesPath, source)
    return {
      source,
      sourcePath
    }
  })

  // Allow dependency locations to be overridden when developing
  serviceSources = serviceSources.map((serviceSource) => {
    const key = `MODULE__${serviceSource.source}`.replace(/@/g, '').replace(/[-/]/g, '_')
    const value = process.env[key]
    if (value) {
      log('Overriding components module', { sourceEnvVar: key, sourcePath: value })

      serviceSource.sourcePath = value
    }

    return serviceSource
  })

  return serviceSources
}

module.exports = configureDependencies
