const path = require('path')
const {default: produce} = require('immer')
const jp = require('jsonpath')
const writeFileAtomic = require('write-file-atomic')
const get = require('lodash.get')
const set = require('lodash.set')
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
let serviceSources = []

const external = {}

external.getRuntimeData = getRuntimeData

external.loadServiceData = () => {
  const sourceObjs = external.getServiceSources()
  const schemas = external.getServiceSchemas()
  return external.getRuntimeData(sourceObjs, schemas)
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

external.getSchemaCategories = () => {
  const schemaCategories = {}
  const schemas = external.getServiceSchemas()
  Object.keys(schemas).forEach(sch => {
    if (sch.startsWith('definition.')) {
      return
    }
    if (schemas[sch].category) {
      schemas[sch].category.forEach(cat => {
        if (cat === 'definition') {
          return
        }
        schemaCategories[cat] = schemaCategories[cat] || []
        schemaCategories[cat].push(sch)
      })
    }
  })
  Object.keys(schemaCategories).forEach(category => {
    schemaCategories[category].sort()
  })
  return schemaCategories
}

external.getSchemaNameByCategory = (category) => {
  return external.getSchemaCategories()[category] || []
}
external.getSchemaPropertyAllowableTypes = (schemaName, property) => {
  let itemsName = []
  const schema = external.getServiceSchema(schemaName)
  const schemaItems = get(schema, `properties["${property}"].items`)
  if (schemaItems._name) {
    itemsName = [schemaItems._name]
  }
  // else if (Array.isArray(schemaItems)) {
  //   itemsName = schemaItems.map(schemaItem => schemaItem._name)
  // }
  let allowables = []
  itemsName.forEach(itemName => {
    if (itemName.startsWith('definition.')) {
      allowables.push(...external.getSchemaNameByCategory(itemName.replace(/^definition\./, '')))
    } else {
      allowables.push(itemName)
    }
  })
  return allowables
}

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

external.getString = (_id) => {
  // TODO: pass through language details
  return external.getInstanceProperty(_id, 'value')
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

external.getInstancesByPropertyValue = (property, value) => {
  const instances = external.getServiceInstances()
  if (typeof value === 'string') {
    value = `"${value}"`
  }
  return jp.query(instances, `$..[?(@.${property} === ${value})]`)
}

external.getInstanceByPropertyValue = (property, value) => {
  return external.getInstancesByPropertyValue(property, value)[0]
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
  // NB. this is hard-coded to ensure no writing of data into modules
  // TODO: consider if $source is necessary at all in this part of the dance
  const source = discreteInstance.$source ? 'service' : undefined
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
  set(newInstance, property, value)
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

external.expandInstance = (instance, addError) => {
  return produce(instance, draft => {
    if (draft._isa) {
      let [_isa, service] = draft._isa.split('=>').reverse()
      if (!service) {
        const isaDiscreteInstance = external.getDiscreteInstance(_isa)
        if (!isaDiscreteInstance) {
          addError('instance.isa.missing', 'instance')
          return
        }
        service = isaDiscreteInstance.$source
      }
      let isaSourceInstance = external.getSourceInstance(_isa, service)
      if (!isaSourceInstance) {
        addError('instance.isa.source.missing', 'instance')
      } else {
        isaSourceInstance = external.expandInstance(isaSourceInstance, addError)
      }
      draft = Object.assign({}, isaSourceInstance, draft)
    }
    return draft
  })
}

// const tempFile = {}
// external.temporaryFile = tempFile

// tempFile.getPath = (_id) => {
//   const tmpInstancePath = path.join(external.getSourcePath('service'), '.temporary', _id)
//   return tmpInstancePath
// }
// tempFile.get = (_id) => {
//   const tmpInstancePath = tempFile.getPath(_id)
//   const source = fs.readFileSync(tmpInstancePath).toString()
//   const sourceInstance = JSON.parse(source)
//   return sourceInstance
// }
// tempFile.set = (_id, data) => {
//   const tmpInstancePath = tempFile.getPath(_id)
//   const error = fs.writeFileSync(tmpInstancePath, JSON.stringify(data, null, 2))
//   return new Promise((resolve, reject) => {
//     if (error) {
//       reject(error)
//     } else {
//       resolve()
//     }
//   })
// }
// tempFile.unset = (_id) => {
//   const tmpInstancePath = tempFile.getPath(_id)
//   fs.unlinkSync(tmpInstancePath)
// }

external.freeze = () => {
  Object.freeze(external)
}

module.exports = external
