const path = require('path')

const {
  initControllers,
  addControllers,
  addModule,
  requireController
} = require('../../../controller/controller')

const loadControllers = (serviceSources) => {
  // Load view and component controllers
  initControllers()
  const controllerSources = serviceSources.slice().reverse()
  controllerSources.forEach(dataSource => {
    if (!dataSource.module) {
      return
    }
    try {
      const controllers = requireController(path.join(dataSource.sourcePath, 'controller', 'controller'))
      addControllers(controllers)
    } catch (e) {
    // no controllers
    }
    try {
      const entrypoint = requireController(path.join(dataSource.sourcePath, 'controller', dataSource.module))
      addModule(dataSource.module, entrypoint)
    } catch (e) {
    // no entrypoint
    }
  })
}

module.exports = loadControllers
