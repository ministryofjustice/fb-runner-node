const path = require('path')
const {default: produce} = require('immer')
const jp = require('jsonpath')
const writeFileAtomic = require('write-file-atomic')
const get = require('lodash.get')
const sortKeys = require('sort-keys')

const {FBError, deepClone} = require('@ministryofjustice/fb-utils-node')

const {getRuntimeData} = require('@ministryofjustice/fb-runtime-node')

class FBServiceDataError extends FBError {
  constructor (error = {}) {
    super({
      error
    })
  }
}

let timestamp
let serviceInstances = {}
let sourceInstances = {}
let serviceSchemas = {}
let serviceSources = {}

const external = {}

external.loadServiceData = () => {
  const sourceObjs = external.getServiceSources()
  const schemas = external.getServiceSchemas()
  return getRuntimeData(sourceObjs, schemas)
    .then(serviceData => {
      external.setServiceInstances(serviceData)
      return serviceData
    })
}

external.getTimestamp = () => timestamp

external.setServiceSchemas = (schemas) => {
  if (!Object.isFrozen(serviceSchemas)) {
    serviceSchemas = schemas
    Object.freeze(serviceSchemas)
  } else {
    throw new FBServiceDataError({
      code: 'ESERVICESCHEMASFROZEN',
      message: 'Attempt to set frozen service schemas'
    })
  }
}

external.getServiceSchemas = () => serviceSchemas

external.getServiceSchema = (name) => external.getServiceSchemas()[name]

external.setServiceSources = (sourceObjs) => {
  if (!Object.isFrozen(serviceSources)) {
    serviceSources = sourceObjs
    Object.freeze(serviceSources)
  } else {
    throw new FBServiceDataError({
      code: 'ESERVICESOURCESFROZEN',
      message: 'Attempt to set frozen service sources'
    })
  }
}

external.getServiceSources = () => serviceSources

external.getSourcePath = (source) => {
  const sourceObj = external.getServiceSources().filter(sourceObj => sourceObj.source === source)
  if (sourceObj[0]) {
    return sourceObj[0].path
  }
}

external.setSourceInstances = (data) => {
  sourceInstances = data
}

external.getSourceInstances = () => {
  return sourceInstances
}

external.setServiceInstances = (instances, freeze) => {
  if (!Object.isFrozen(serviceInstances)) {
    serviceInstances = deepClone(instances)
    instances.sourceInstances = instances.sourceInstances || {}
    external.setSourceInstances(instances.sourceInstances.data)
    timestamp = Date.now().toString()
  } else {
    throw new FBServiceDataError({
      code: 'ESERVICEDATAFROZEN',
      message: 'Attempt to set frozen service data'
    })
  }
  if (freeze) {
    Object.freeze(serviceInstances)
  }
  return serviceInstances
}

external.getServiceInstances = () => {
  return serviceInstances
}

external.getInstance = (id, defaultValue) => {
  const topLevelInstance = external.getServiceInstances()[id]
  if (topLevelInstance) {
    return topLevelInstance
  }
  return jp.query(external.getServiceInstances(), `$..[?(@._id === "${id}")]`)[0] || defaultValue
}

external.getDiscreteInstance = (id) => {
  const topLevelInstance = external.getServiceInstances()[id]
  if (topLevelInstance) {
    return topLevelInstance
  }
  const paths = jp.paths(external.getServiceInstances(), `$..[?(@._id === "${id}")]`)[0]
  if (paths && paths[1]) {
    return external.getInstance(paths[1])
  }
}

external.getInstanceProperty = (id, property, defaultValue) => {
  const instance = external.getInstance(id) || {}
  return get(instance, property, defaultValue)
}

external.getInstancePathPrefix = (type) => {
  if (type.startsWith('page.')) {
    return 'page'
  } else if (type.startsWith('config')) {
    return 'config'
  } else if (type.startsWith('string') || type.startsWith('strings')) {
    return 'string'
  } else {
    return 'component'
  }
}

external.writeFileAtomic = (instancePath, instance, errFn, fn) => {
  const instanceJSON = JSON.stringify(sortKeys(instance, {deep: true}), null, 2)
  writeFileAtomic(instancePath, instanceJSON, (err) => {
    if (err) {
      errFn(err)
    } else {
      fn(true)
    }
  })
}

const saveInstance = (sourcePath, instance) => {
  const pathPrefix = external.getInstancePathPrefix(instance._type)
  const instancePath = path.join(sourcePath, pathPrefix, `${instance._id}.json`)
  // TODO: Ensure that instancePath actually exists
  return new Promise((resolve, reject) => {
    external.writeFileAtomic(instancePath, instance, reject, resolve)
  })
}

const throwRejectedPromise = (error) => {
  return Promise.reject(new FBServiceDataError({error}))
}

external.setInstance = (instance) => {
  const {_id: id} = instance
  if (!id) {
    return throwRejectedPromise({
      code: 'ESETINSTANCEMISSINGID',
      message: 'No id passed for instance'
    })
  }
  if (!instance._type) {
    return throwRejectedPromise({
      code: 'ESETINSTANCEMISSINGTYPE',
      message: `Instance ‘${id}’ has no type`
    })
  }
  const discreteInstance = external.getDiscreteInstance(id)
  if (!discreteInstance) {
    return throwRejectedPromise({
      code: 'ESETINSTANCEINSTANCENOTFOUND',
      message: `Instance ‘${id}’ not found`
    })
  }
  const source = discreteInstance.$source
  if (!source) {
    return throwRejectedPromise({
      code: 'ESETINSTANCENOSOURCE',
      message: `Instance ‘${id}’ has no source`
    })
  }
  const sourcePath = external.getSourcePath(source)
  if (!sourcePath) {
    return throwRejectedPromise({
      code: 'ESETINSTANCESOURCENOTFOUND',
      message: `Source specified for instance ‘${id}’ does not exist`
    })
  }

  let instanceOut = instance
  if (id !== discreteInstance._id) {
    const sourceDiscreteInstance = external.getSourceDiscreteInstance(id, source)
    instanceOut = produce(sourceDiscreteInstance, draft => {
      jp.apply(draft, `$..[?(@._id === "${id}")]`, value => instanceOut)
      return draft
    })
  }

  return saveInstance(sourcePath, instanceOut)
}

external.setInstanceProperty = (id, property, value) => {
  if (typeof id === 'object') {
    id = id._id
  }
  if (!id) {
    return throwRejectedPromise({
      code: 'ESETINSTANCEPROPERTYMISSINGID',
      message: 'No id passed to setInstanceProperty'
    })
  }
  if (!property) {
    return throwRejectedPromise({
      code: 'ESETINSTANCEPROPERTYMISSINGPROPERTY',
      message: `No property for instance ‘${id}’ passed to setInstanceProperty`
    })
  }
  const protectedProperties = [
    '_id',
    '_type'
  ]
  if (protectedProperties.includes(property)) {
    return throwRejectedPromise({
      code: 'ESETINSTANCEPROPERTYPROTECTED',
      message: `Property ‘${property}’ for instance ‘${id}’ is protected`
    })
  }
  const instance = external.getDiscreteInstance(id)
  const newInstance = external.getSourceInstance(id, instance.$source)
  newInstance[property] = value
  return external.setInstance(newInstance)
}

external.createInstance = (instance, options = {}) => {
  const {_id: id} = instance
  if (!id) {
    return throwRejectedPromise({
      code: 'ECREATEINSTANCEMISSINGID',
      message: 'No id passed for instance'
    })
  }
  if (!instance._type) {
    return throwRejectedPromise({
      code: 'ECREATEINSTANCEMISSINGTYPE',
      message: `Instance ‘${id}’ has no type`
    })
  }
  const existsInstance = external.getInstance(id)
  if (existsInstance) {
    return throwRejectedPromise({
      code: 'ECREATEINSTANCEINSTANCEEXISTS',
      message: `Instance ‘${id}’ already exists`
    })
  }

  let newInstance = instance
  let source = options.source || 'service'

  const {_id: addId, property: addProperty, operation = 'push'} = options
  if (addId) {
    if (!addProperty) {
      return throwRejectedPromise({
        code: 'ECREATEINSTANCEADDNOPROPERTY',
        message: `Instance ‘${addId}’ specified to add new instance ‘${id}’ to without any property`
      })
    }
    const addInstance = external.getDiscreteInstance(addId)
    if (!addInstance) {
      return throwRejectedPromise({
        code: 'ECREATEINSTANCEADDNOTFOUND',
        message: `Instance ‘${addId}’ to add new instance ‘${id}’ to not found`
      })
    }
    source = addInstance.$source
    if (!source) {
      return throwRejectedPromise({
        code: 'ECREATEINSTANCEADDNOSOURCE',
        message: `Instance ‘${addId}’ to add new instance ‘${id}’ to has no source`
      })
    }

    const sourceDiscreteInstance = external.getSourceDiscreteInstance(addInstance._id, source)
    newInstance = produce(sourceDiscreteInstance, draft => {
      const insertionPoint = jp.query({draft}, `$..[?(@._id === "${addId}")]`)[0]
      if (insertionPoint) {
        insertionPoint[addProperty] = insertionPoint[addProperty] || []
        insertionPoint[addProperty][operation](deepClone(newInstance))
      }
      return draft
    })
  }

  const sourcePath = external.getSourcePath(source)
  if (!sourcePath) {
    return throwRejectedPromise({
      code: 'ECREATEINSTANCESOURCENOTFOUND',
      message: `Source specified for instance ‘${id}’ does not exist`
    })
  }

  return saveInstance(sourcePath, newInstance)
}

external.getSourceInstance = (id, source = 'service', defaultValue) => {
  const sourceData = external.getSourceInstances()[source]
  if (!sourceData) {
    return
  }
  const topLevelInstance = sourceData[id]
  if (topLevelInstance) {
    return topLevelInstance
  }
  return jp.query(sourceData, `$..[?(@._id === "${id}")]`)[0] || defaultValue
}

external.getSourceDiscreteInstance = (id, source = 'service') => {
  const sourceData = external.getSourceInstances()[source]
  if (!sourceData) {
    return
  }
  const topLevelInstance = sourceData[id]
  if (topLevelInstance) {
    return topLevelInstance
  }
  const paths = jp.paths(sourceData, `$..[?(@._id === "${id}")]`)[0]
  if (paths && paths[1]) {
    return external.getSourceInstance(paths[1])
  }
}

external.getSourceInstanceProperty = (id, property, source = 'service', defaultValue) => {
  const instance = external.getSourceInstance(id, source) || {}
  return get(instance, property, defaultValue)
}

external.freeze = () => {
  Object.freeze(external)
}

module.exports = external
