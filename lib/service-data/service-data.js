const get = require('lodash.get')

let serviceInstances = {}

const setServiceInstances = (instances) => {
  serviceInstances = instances
  return instances
}

const getServiceInstances = () => {
  return serviceInstances
}

const getInstance = (id, defaultValue) => {
  return serviceInstances[id] || defaultValue
}

const setInstance = (id) => {

}

const getInstanceProperty = (id, property, defaultValue) => {
  return get(serviceInstances[id], property, defaultValue)
}

const serviceData = {
  setServiceInstances,
  getServiceInstances,
  getInstance,
  setInstance,
  getInstanceProperty
}

module.exports = serviceData
