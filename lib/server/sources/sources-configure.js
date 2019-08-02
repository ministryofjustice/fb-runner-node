const path = require('path')
const {
  existsSync,
  readdirSync,
  writeFileSync
} = require('fs')
const {execSync} = require('child_process')
const isOnline = require('is-online')
const loadJson = require('load-json-file').sync

const {FBLogger, FBError} = require('@ministryofjustice/fb-utils-node')
class FBServerError extends FBError {}

// const {
//   initControllers,
//   addControllers,
//   addModule
// } = require('../../controller/controller')

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
  const modulesPath = path.join(RUNNER_DIR, 'lib', 'module')
  const fbModules = readdirSync(modulesPath)

  const modulesConfigPath = path.join(serviceConfigPath, 'config.modules.json')
  let modulesConfig
  let modulesConfigRewrite
  try {
    modulesConfig = loadJson(modulesConfigPath)
  } catch (e) {
    modulesConfig = {
      _id: 'config.modules',
      _type: 'config.modules',
      modules: []
    }
    modulesConfigRewrite = true
  }

  // Add any modules to config we don't know about
  fbModules.forEach(module => {
    const moduleId = `config.module.${module}`
    const hasModuleConfig = modulesConfig.modules.filter(moduleConfig => moduleConfig._id === moduleId).length
    if (!hasModuleConfig) {
      const modulePackagePath = path.join(modulesPath, module, 'package.json')
      const modulePackage = loadJson(modulePackagePath)
      modulesConfig.modules.push({
        _id: moduleId,
        _type: 'config.module',
        enabled: 'off',
        module,
        title: modulePackage.title
      })
      modulesConfigRewrite = true
    }
  })

  // Remove any modules from config that the runner does not have
  const modulesCount = modulesConfig.modules.length
  modulesConfig.modules = modulesConfig.modules.filter(moduleConfig => fbModules.includes(moduleConfig.module))
  if (modulesCount !== modulesConfig.modules.length) {
    modulesConfigRewrite = true
  }

  // Rewrite config.modules if updated
  if (modulesConfigRewrite) {
    const modulesConfigData = JSON.stringify(modulesConfig, null, 2)
    writeFileSync(modulesConfigPath, modulesConfigData)
    FBLogger('Generated modules config file', modulesConfigPath)
  }

  // Load any enabled modules
  fbModules.forEach(module => {
    const moduleConfig = modulesConfig.modules.filter(moduleConfig => module === moduleConfig.module)[0]
    if (moduleConfig.enabled !== 'on') {
      return
    }
    FBLogger(`Enabled module ${module}`)
    serviceSources.push({
      source: `module:${module}`,
      sourcePath: path.join(modulesPath, module),
      module
    })
  })

  // Add app and service paths
  serviceSources.push({
    source: 'app',
    sourcePath: APP_DIR
  })
  serviceSources.push({
    source: 'service',
    sourcePath: resolvedServicePath
  })

  // // Load view and component controllers
  // initControllers()
  // const controllerSources = serviceSources.slice().reverse()
  // controllerSources.forEach(dataSource => {
  //   if (!dataSource.module) {
  //     return
  //   }
  //   try {
  //     const controllers = require(path.join(dataSource.sourcePath, 'controller', 'controller'))
  //     addControllers(controllers)
  //   } catch (e) {
  //   // no controllers
  //   }
  //   try {
  //     const entrypoint = require(path.join(dataSource.sourcePath, 'controller', dataSource.module))
  //     addModule(dataSource.module, entrypoint)
  //   } catch (e) {
  //   // no entrypoint
  //   }
  // })

  return {
    serviceSources,
    locals: {
      govuk_frontend_version: govukFrontendVersion
    }
  }
}

module.exports = configureSources
