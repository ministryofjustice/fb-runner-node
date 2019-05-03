const path = require('path')

const {
  isPage
} = require('../service-data/service-data')

const controllers = {
  page: {
    instance: {},
    type: {}
  },
  component: {
    instance: {},
    type: {}
  }
}

const initControllers = (componentDirs) => {
  controllers.page.type = require('./page/type/page-type-controllers')
  controllers.page.instance = require('./page/instance/page-instance-controllers')
  controllers.component.type = require('./component/type/component-type-controllers')

  // load any controllers in component directories
  componentDirs.forEach(componentDir => {
    try {
      const controllersPath = path.join(componentDir.sourcePath, 'controller', 'controller')
      const componentDirControllers = require(controllersPath)
      Object.keys(componentDirControllers).forEach(type => {
        controllers[type] = controllers[type] || {}
        const typeControllers = componentDirControllers[type]
        Object.keys(typeControllers).forEach(instanceType => {
          controllers[type][instanceType] = controllers[type][instanceType] || {}
          const instanceTypeControllers = typeControllers[instanceType]
          controllers[type][instanceType] = Object.assign({}, instanceTypeControllers, controllers[type][instanceType])
        })
      })
    } catch (e) {
      // no controllers found
    }
  })
}

const getControllers = (schemaType, instanceType) => {
  if (schemaType && !controllers[schemaType]) {
    return {}
  }
  if (instanceType) {
    return controllers[schemaType][instanceType] || {}
  }
  if (schemaType) {
    return controllers[schemaType]
  }
  return controllers
}

const getController = (schemaType, instanceType, key) => {
  const typeControllers = getControllers(schemaType, instanceType)
  return typeControllers[key] || {}
}

const getInstanceController = (instance) => {
  const instanceType = isPage(instance) ? 'page' : 'component'
  const typeController = getController(instanceType, 'type', instance._type)
  const instanceController = getController(instanceType, 'instance', instance._id)
  const controller = Object.assign({}, typeController, instanceController)
  return controller
}

module.exports = {
  initControllers,
  getControllers,
  getController,
  getInstanceController
}
