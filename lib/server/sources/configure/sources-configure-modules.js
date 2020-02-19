const path = require('path')
const {
  readdirSync,
  writeFileSync
} = require('fs')
const loadJson = require('load-json-file').sync

const debug = require('debug')
const log = debug('runner:sources-configure-modules')

debug.enable('runner:*')

function configureModules (serviceConfigPath, runnerDir) {
  log(serviceConfigPath, runnerDir)

  const serviceSources = []
  const modulesPath = path.join(runnerDir, 'lib/module')
  const modules = readdirSync(modulesPath).filter(dir => !dir.startsWith('.'))

  log(modulesPath)

  const modulesConfigPath = path.join(serviceConfigPath, 'config.modules.json')

  log(modulesConfigPath)

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
  modules.forEach(module => {
    const moduleId = `config.module.${module}`
    const hasModuleConfig = modulesConfig.modules.filter(moduleConfig => moduleConfig._id === moduleId).length

    log(moduleId, hasModuleConfig)

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
  modulesConfig.modules = modulesConfig.modules.filter(moduleConfig => modules.includes(moduleConfig.module))
  if (modulesCount !== modulesConfig.modules.length) {
    modulesConfigRewrite = true
  }

  // Rewrite config.modules if updated
  if (modulesConfigRewrite) {
    const modulesConfigData = JSON.stringify(modulesConfig, null, 2)

    writeFileSync(modulesConfigPath, modulesConfigData)

    log(`Generated modules configuration file at "${modulesConfigPath}"`)
  }

  log(modules)

  // Load any enabled modules
  modules.forEach(module => {
    log(module)

    const moduleConfig = modulesConfig.modules.find((moduleConfig) => module === moduleConfig.module)
    if (moduleConfig.enabled !== 'on') {
      return
    }

    log(`Enabled module "${module}"`)

    serviceSources.push({
      source: `module:${module}`,
      sourcePath: path.join(modulesPath, module),
      module
    })
  })

  log(serviceSources)

  return serviceSources
}

module.exports = configureModules
