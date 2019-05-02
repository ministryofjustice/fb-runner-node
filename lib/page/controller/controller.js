const path = require('path')

const {
  isPage
} = require('../../service-data/service-data')

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

controllers.page.type = require('../controller/page-type-controllers')
controllers.page.instance = require('../controller/page-instance-controllers')
controllers.component.type = require('../controller/component-type-controllers')

const initControllers = (componentDirs) => {
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

const getControllers = (type, instanceType) => {
  if (instanceType) {
    return controllers[type][instanceType]
  }
  if (type) {
    return controllers[type]
  }
  return controllers
}

const getController = (type, instanceType, key) => {
  const typeControllers = getControllers(type, instanceType)
  return typeControllers ? typeControllers[key] : {}
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
