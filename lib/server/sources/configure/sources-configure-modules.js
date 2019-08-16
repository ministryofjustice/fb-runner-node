const path = require('path')
const {
  readdirSync,
  writeFileSync
} = require('fs')
const loadJson = require('load-json-file').sync

const {FBLogger} = require('@ministryofjustice/fb-utils-node')

const configureModules = (serviceConfigPath, runnerDir) => {
  const serviceSources = []
  const modulesPath = path.join(runnerDir, 'lib', 'module')
  const fbModules = readdirSync(modulesPath).filter(dir => !dir.startsWith('.'))

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

  return serviceSources
}

module.exports = configureModules
