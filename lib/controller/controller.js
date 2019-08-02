// const path = require('path')

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

const modules = {}

/**
* Add controllers
*
* @param {object} cs
* Controllers object
*
* @param {object} [cs.pageInstance]
* Object of page instance controllers
*
* @param {object} [cs.pageType]
* Object of page type controllers
*
* @param {object} [cs.componentInstance]
* Object of component instance controllers
* Provided - but unlikely to be useful
*
* @param {object} [cs.componentType]
* Object of component type controllers
*
* @return {object}
* Controllers
*/
const addControllers = (cs) => {
  if (cs.pageInstance) {
    controllers.page.instance = Object.assign(controllers.page.instance, cs.pageInstance)
  }
  if (cs.pageType) {
    Object.assign(controllers.page.type, cs.pageType)
  }
  if (cs.componentInstance) {
    Object.assign(controllers.component.instance, cs.componentInstance)
  }
  if (cs.componentType) {
    Object.assign(controllers.component.type, cs.componentType)
  }
  // console.log(controllers)
  return controllers
}

const initControllers = () => {
  const pageType = require('./page/type/page-type-controllers')
  const componentType = require('./component/type/component-type-controllers')
  addControllers({
    pageType,
    componentType
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

const addModule = (module, loadedModule) => {
  modules[module] = loadedModule
}

const getModules = () => {
  return modules
}

const getModule = (module) => {
  return modules[module] || {}
}

const requireController = (path) => require(path)

module.exports = {
  initControllers,
  addControllers,
  getControllers,
  getController,
  getInstanceController,
  addModule,
  getModules,
  getModule,
  requireController
}
