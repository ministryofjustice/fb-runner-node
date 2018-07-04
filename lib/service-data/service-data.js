const fs = require('fs')
const path = require('path')
const {FBError} = require('@ministryofjustice/fb-utils-node')
const get = require('lodash.get')

class FBServiceError extends FBError {}

let frozen = false
let serviceInstances = {}

let serviceSchemas = {}
let serviceSources = {}

const setServiceSchemas = (schemas) => {
  if (!Object.isFrozen(serviceSchemas)) {
    serviceSchemas = schemas
    Object.freeze(serviceSchemas)
  } else {
    throw new FBServiceError({
      code: 'ESERVICESCHEMASFROZEN',
      message: 'Attempt to set frozen service schemas'
    })
  }
  // sourceObjs.forEach(sourceObj => {
  //   serviceSources[sourceObj.source] = sourceObj.path
  // })
}

const getServiceSchemas = () => serviceSchemas

const setServiceSources = (sourceObjs) => {
  if (!Object.isFrozen(serviceSources)) {
    serviceSources = sourceObjs
    Object.freeze(serviceSources)
  } else {
    throw new FBServiceError({
      code: 'ESERVICESOURCESFROZEN',
      message: 'Attempt to set frozen service sources'
    })
  }
  // sourceObjs.forEach(sourceObj => {
  //   serviceSources[sourceObj.source] = sourceObj.path
  // })
}

const getServiceSources = () => serviceSources

const setServiceInstances = (instances, freeze) => {
  if (!frozen) {
    serviceInstances = instances
  } else {
    throw new FBServiceError({
      code: 'ESERVICEDATAFROZEN',
      message: 'Attempt to set frozen service data'
    })
  }
  if (freeze) {
    frozen = true
    Object.freeze(serviceInstances)
  }
  return serviceInstances
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

const getSourceInstance = (id, source = 'service') => {
  return serviceInstances.sourceInstances[source][id]
}

const getInstancePathPrefix = (type) => {
  if (type.startsWith('page.')) {
    return 'page'
  } else if (type.startsWith('string') || type.startsWith('strings')) {
    return 'string'
  } else {
    return 'component'
  }
}

const setSourceInstance = (id, instance, source = 'service') => {
  // bogus
  serviceInstances.sourceInstances[source][id] = instance
  const pathPrefix = getInstancePathPrefix(instance._type)
  return serviceInstances.sourceInstances[source][id]
}

const serviceData = {
  setServiceSchemas,
  getServiceSchemas,
  setServiceSources,
  getServiceSources,
  setServiceInstances,
  getServiceInstances,
  getInstance,
  setInstance,
  getInstanceProperty,
  getSourceInstance,
  setSourceInstance
}

module.exports = serviceData
