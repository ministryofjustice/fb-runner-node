'use strict'

const test = require('tape')
const {stub} = require('sinon')
const jp = require('jsonpath')

const fs = require('fs')

const {deepClone} = require('@ministryofjustice/fb-utils-node')

const serviceData = require('./service-data')
const {
  getTimestamp,
  setServiceSchemas,
  getServiceSchemas,
  setServiceSources,
  getServiceSources,
  getServiceSchema,
  setServiceInstances,
  getServiceInstances,
  getInstance,
  getDiscreteInstance,
  getInstanceProperty,
  setInstance,
  setInstanceProperty,
  createInstance,
  getSourceInstance,
  getSourceDiscreteInstance,
  getSourceInstanceProperty
} = serviceData

test('When userData is required ', t => {
  t.equal(typeof getTimestamp, 'function', 'it should export the getTimestamp method')
  t.equal(typeof setServiceSchemas, 'function', 'it should export the setServiceSchemas method')
  t.equal(typeof getServiceSchemas, 'function', 'it should export the getServiceSchemas method')
  t.equal(typeof setServiceSources, 'function', 'it should export the setServiceSources method')
  t.equal(typeof getServiceSources, 'function', 'it should export the getServiceSources method')
  t.equal(typeof setServiceInstances, 'function', 'it should export the setServiceInstances method')
  t.equal(typeof getServiceInstances, 'function', 'it should export the getServiceInstances method')
  t.equal(typeof getInstance, 'function', 'it should export the getInstance method')
  t.equal(typeof getDiscreteInstance, 'function', 'it should export the getDiscreteInstance method')
  t.equal(typeof getInstanceProperty, 'function', 'it should export the getInstanceProperty method')
  t.equal(typeof setInstance, 'function', 'it should export the setInstance method')
  t.equal(typeof setInstanceProperty, 'function', 'it should export the setInstanceProperty method')
  t.equal(typeof createInstance, 'function', 'it should export the createInstance method')
  t.equal(typeof getSourceInstance, 'function', 'it should export the getSourceInstance method')
  t.equal(typeof getSourceDiscreteInstance, 'function', 'it should export the getSourceDiscreteInstance method')
  t.equal(typeof getSourceInstanceProperty, 'function', 'it should export the getSourceInstanceProperty method')
  t.end()
})

test('When the service schemas have been set', t => {
  t.plan(6)

  const schemas = {a: {$id: 'http://a'}, b: {$id: 'http://b'}}
  setServiceSchemas(schemas)

  t.deepEqual(getServiceSchemas(), schemas, 'getServiceSchemas should return all the schemas')
  t.deepEqual(getServiceSchema('a'), schemas.a, 'getServiceSchema should return the individual schema requested')

  let error
  try {
    setServiceSchemas()
  } catch (e) {
    error = e
  }

  t.equals(error.name, 'FBServiceDataError', 'setServiceSchemas should throw an error if an attempt is made to set the schemas again')
  t.equals(error.message, 'Attempt to set frozen service schemas', 'setServiceSchemas should return the correct error message')
  t.equals(error.code, 'ESERVICESCHEMASFROZEN', 'setServiceSchemas should return the correct error code')

  t.deepEqual(getServiceSchemas(), schemas, 'getServiceSchemas should still return all the original schemas after a failed attempt to set the schemas')
  t.end()
})

test('When the service sources have been set', t => {
  t.plan(5)

  const sourceObjs = [
    {
      source: 'service',
      path: '/service-path/metadata'
    },
    {
      source: 'core',
      path: '/core-path/metadata'
    }
  ]

  setServiceSources(deepClone(sourceObjs))

  t.deepEqual(getServiceSources(), sourceObjs, 'getServiceSources should return all the sources')

  let error
  try {
    setServiceSources()
  } catch (e) {
    error = e
  }

  t.equals(error.name, 'FBServiceDataError', 'setServiceSources should throw an error if an attempt is made to set the sources again')
  t.equals(error.message, 'Attempt to set frozen service sources', 'setServiceSources should return the correct error message')
  t.equals(error.code, 'ESERVICESOURCESFROZEN', 'setServiceSources should return the correct error code')

  t.deepEqual(getServiceSources(), sourceObjs, 'getServiceSources should still return all the original sources after a failed attempt to set the sources')
  t.end()
})

test('When the service instances have been set', t => {
  t.plan(21)

  const instances = {
    a: {
      $source: 'service',
      _id: 'a',
      _type: 'discrete'
    },
    b: {
      $source: 'core',
      _id: 'b',
      _type: 'discrete'
    },
    sourceInstances: {
      _type: 'sourceInstances',
      data: {
        service: {
          a: {
            _id: 'a',
            _type: 'discrete'
          }
        },
        core: {
          b: {
            _id: 'b',
            _type: 'discrete'
          }
        }
      }
    }
  }
  setServiceInstances(deepClone(instances))
  const timestampA = getTimestamp()
  t.ok(timestampA, 'getTimestamp should return a timestamp value')
  t.deepEqual(getServiceInstances(), instances, 'getServiceInstances should return all the instances')
  t.deepEqual(getInstance('a'), instances.a, 'getInstance should return the individual instance requested')
  t.deepEqual(getInstance('b'), instances.b, 'getInstance should return the individual instance requested (part 2)')
  t.deepEqual(getInstance('c'), undefined, 'getInstance should return undefined if individual instance requested does not exist')
  t.deepEqual(getSourceInstance('a', 'service'), instances.sourceInstances.data.service.a, 'getSourceInstance should return the individual instance requested')
  t.deepEqual(getSourceInstance('b', 'core'), instances.sourceInstances.data.core.b, 'getSourceInstance should return the individual instance requested (part 2)')
  t.deepEqual(getSourceInstance('c', 'service'), undefined, 'getSourceInstance should return undefined if individual instance requested does not exist')

  const newInstances = {
    a: {
      $source: 'core',
      _id: 'a',
      _type: 'discrete'
    },
    c: {
      $source: 'service',
      _id: 'c',
      _type: 'discrete'
    },
    sourceInstances: {
      _type: 'sourceInstances',
      data: {
        service: {
          c: {
            _id: 'c',
            _type: 'discrete'
          }
        },
        core: {
          a: {
            _id: 'a',
            _type: 'discrete'
          }
        }
      }
    }
  }
  setServiceInstances(deepClone(newInstances), true)
  const timestampB = getTimestamp()
  t.notEqual(timestampA, timestampB, 'getTimestamp should return a changed timestamp value')
  t.deepEqual(getInstance('a'), newInstances.a, 'getInstance should return the individual instance requested')
  t.deepEqual(getInstance('b'), undefined, 'getInstance should return the individual instance requested (part 2)')
  t.deepEqual(getInstance('c'), newInstances.c, 'getInstance should return undefined if individual instance requested')
  t.deepEqual(getSourceInstance('a', 'core'), newInstances.sourceInstances.data.core.a, 'getSourceInstance should return the individual instance requested')
  t.deepEqual(getSourceInstance('c', 'service'), newInstances.sourceInstances.data.service.c, 'getSourceInstance should return the individual instance requested (part 2)')
  t.deepEqual(getSourceInstance('b', 'service'), undefined, 'getSourceInstance should return undefined if individual instance requested does not exist')
  t.deepEqual(getSourceInstance('b', 'missing'), undefined, 'getSourceInstance should return undefined if source does not exist')

  let error
  try {
    setServiceInstances({d: {_id: 'd'}, e: {_id: 'e'}}, true)
  } catch (e) {
    error = e
  }

  const timestampC = getTimestamp()
  t.equal(timestampB, timestampC, 'getTimestamp should return an unchanged timestamp value')
  t.equals(error.name, 'FBServiceDataError', 'setServiceInstances should throw an error if an attempt is made to set the schemas again')
  t.equals(error.message, 'Attempt to set frozen service data', 'setServiceInstances should return the correct error message')
  t.equals(error.code, 'ESERVICEDATAFROZEN', 'setServiceInstances should return the correct error code')

  t.deepEqual(getServiceInstances(), newInstances, 'getServiceSchemas should still return all the original schemas after a failed attempt to set the schemas')

  t.end()
})

const getStubbedServiceInstances = () => {
  const getServiceInstancesStub = stub(serviceData, 'getServiceInstances')
  getServiceInstancesStub.callsFake(() => {
    return deepClone(instances)
  })
  return getServiceInstancesStub
}
const getStubbedSourceInstances = () => {
  const getSourceInstancesStub = stub(serviceData, 'getSourceInstances')
  getSourceInstancesStub.callsFake(() => {
    return deepClone(sourceInstances)
  })
  return getSourceInstancesStub
}
const goodWriteFileAtomicStub = () => {
  const writeFileAtomicStub = stub(serviceData, 'writeFileAtomic')
  writeFileAtomicStub.callsFake((instancePath, instance, errFn, fn) => {
    return fn(true)
  })
  return writeFileAtomicStub
}
const badWriteFileAtomicStub = () => {
  const writeFileAtomicStub = stub(serviceData, 'writeFileAtomic')
  writeFileAtomicStub.callsFake((instancePath, instance, errFn, fn) => {
    return errFn({message: 'Something went wrong'})
  })
  return writeFileAtomicStub
}

const instances = {
  a: {
    $source: 'service',
    _id: 'a',
    _type: 'discrete',
    components: [{
      _id: 'b',
      _type: 'nested',
      items: [{
        _id: 'c',
        _type: 'deepnested',
        string: '',
        number: 0,
        boolean: false
      }]
    }]
  }
}

test('When getInstance is invoked', t => {
  const getServiceInstancesStub = getStubbedServiceInstances()

  t.deepEqual(getInstance('a'), instances.a, 'it should return top level instance if an instance exists')
  t.deepEqual(getInstance('b'), instances.a.components[0], 'it should return nested instance if an instance exists')
  t.deepEqual(getInstance('c'), instances.a.components[0].items[0], 'it should return deeper nested instance if an instance exists')
  t.equal(getInstance('d'), undefined, 'it should return undefined if no instance exists')

  getServiceInstancesStub.restore()
  t.end()
})

test('When getDiscreteInstance is invoked', t => {
  const getServiceInstancesStub = getStubbedServiceInstances()

  t.deepEqual(getDiscreteInstance('a'), instances.a, 'it should return top level instance if top level instance matched')
  t.deepEqual(getDiscreteInstance('b'), instances.a, 'it should return top level instance if a nested instance matched')
  t.deepEqual(getDiscreteInstance('c'), instances.a, 'it should return top level instance if a deeper nested instance matched')
  t.equal(getDiscreteInstance('d'), undefined, 'it should return undefined if no instance exists')

  getServiceInstancesStub.restore()
  t.end()
})

test('When getInstanceProperty is invoked', t => {
  const getServiceInstancesStub = getStubbedServiceInstances()

  t.equal(getInstanceProperty('a', '_id'), 'a', 'it should return the property of top level instance ')
  t.deepEqual(getInstanceProperty('b', 'items'), instances.a.components[0].items, 'it should return property of a nested instance')
  t.equal(getInstanceProperty('c', '_type'), 'deepnested', 'it should return the property of a deeper nested instance')
  t.equal(getInstanceProperty('c', 'monkey'), undefined, 'it should return undefined if property does not exist')
  t.equal(getInstanceProperty('c', 'monkey', 'defaultValue'), 'defaultValue', 'it should return any default value if property does not exist')
  t.equal(getInstanceProperty('c', 'string', 'defaultValue'), '', 'it should return empty string rather than any default value')
  t.equal(getInstanceProperty('c', 'number', 'defaultValue'), 0, 'it should return zero rather than any default value')
  t.equal(getInstanceProperty('c', 'boolean', 'defaultValue'), false, 'it should return false rather than any default value')
  t.equal(getInstanceProperty('d', 'prop'), undefined, 'it should return undefined if no instance exists')

  getServiceInstancesStub.restore()
  t.end()
})

const sourceInstances = {
  service: {
    a: {
      _id: 'a',
      _type: 'discrete',
      components: [{
        _id: 'b',
        _type: 'nested',
        items: [{
          _id: 'c',
          _type: 'deepnested',
          string: '',
          number: 0,
          boolean: false
        }]
      }]
    }
  }
}

test('When getSourceInstance is invoked', t => {
  const getSourceInstancesStub = getStubbedSourceInstances()

  t.deepEqual(getSourceInstance('a', 'service'), sourceInstances.service.a, 'it should return top level instance if an instance exists')
  t.deepEqual(getSourceInstance('b', 'service'), sourceInstances.service.a.components[0], 'it should return nested instance if an instance exists')
  t.deepEqual(getSourceInstance('c', 'service'), sourceInstances.service.a.components[0].items[0], 'it should return deeper nested instance if an instance exists')
  t.equal(getSourceInstance('d', 'service'), undefined, 'it should return undefined if no instance exists')
  t.equal(getSourceInstance('a', 'missing'), undefined, 'it should return undefined if no source data exists')

  getSourceInstancesStub.restore()
  t.end()
})

test('When getDiscreteInstance is invoked', t => {
  const getSourceInstancesStub = getStubbedSourceInstances()

  t.deepEqual(getSourceDiscreteInstance('a', 'service'), sourceInstances.service.a, 'it should return top level instance if top level instance matched')
  t.deepEqual(getSourceDiscreteInstance('b', 'service'), sourceInstances.service.a, 'it should return top level instance if a nested instance matched')
  t.deepEqual(getSourceDiscreteInstance('c', 'service'), sourceInstances.service.a, 'it should return top level instance if a deeper nested instance matched')
  t.equal(getSourceDiscreteInstance('d', 'service'), undefined, 'it should return undefined if no instance exists')
  t.equal(getSourceDiscreteInstance('a', 'missing'), undefined, 'it should return undefined if no source data exists')

  getSourceInstancesStub.restore()
  t.end()
})

test('When getSourceInstanceProperty is invoked', t => {
  const getSourceInstancesStub = getStubbedSourceInstances()

  t.equal(getSourceInstanceProperty('a', '_id', 'service'), 'a', 'it should return the property of top level instance ')
  t.deepEqual(getSourceInstanceProperty('b', 'items', 'service'), sourceInstances.service.a.components[0].items, 'it should return property of a nested instance')
  t.equal(getSourceInstanceProperty('c', '_type', 'service'), 'deepnested', 'it should return the property of a deeper nested instance')
  t.equal(getSourceInstanceProperty('c', 'monkey', 'service'), undefined, 'it should return undefined if property does not exist')
  t.equal(getSourceInstanceProperty('c', 'monkey', 'service', 'defaultValue'), 'defaultValue', 'it should return any default value if property does not exist')
  t.equal(getSourceInstanceProperty('c', 'string', 'service', 'defaultValue'), '', 'it should return empty string rather than any default value')
  t.equal(getSourceInstanceProperty('c', 'number', 'service', 'defaultValue'), 0, 'it should return zero rather than any default value')
  t.equal(getSourceInstanceProperty('c', 'boolean', 'service', 'defaultValue'), false, 'it should return false rather than any default value')
  t.equal(getSourceInstanceProperty('d', 'prop', 'service'), undefined, 'it should return undefined if no instance exists')

  getSourceInstancesStub.restore()
  t.end()
})

test('When setInstance is invoked on a discrete instance', t => {
  t.plan(3)
  const getServiceInstancesStub = getStubbedServiceInstances()
  const getSourceInstancesStub = getStubbedSourceInstances()
  const writeFileAtomicStub = goodWriteFileAtomicStub()

  setInstance({
    _id: 'a',
    _type: 'foo'
  })
    .then(res => {
      t.equal(res, true, 'it should successfully write the instance')
      const args = writeFileAtomicStub.getCall(0).args
      t.equal(args[0], '/service-path/metadata/component/a.json', 'it should write to the correct path name')
      t.deepEqual(args[1], {_id: 'a', _type: 'foo'}, 'it should write the correct instance data')
    })

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
  writeFileAtomicStub.restore()
})

test('When setInstance is invoked on a nested instance', t => {
  t.plan(3)
  const getServiceInstancesStub = getStubbedServiceInstances()
  const getSourceInstancesStub = getStubbedSourceInstances()
  const writeFileAtomicStub = goodWriteFileAtomicStub()

  setInstance({
    _id: 'b',
    _type: 'middle'
  })
    .then(res => {
      t.equal(res, true, 'it should successfully write the file')
      const args = writeFileAtomicStub.getCall(0).args
      t.equal(args[0], '/service-path/metadata/component/a.json', 'it should write to the correct path name')
      t.deepEqual(args[1], {_id: 'a', _type: 'discrete', components: [{_id: 'b', _type: 'middle'}]}, 'it should write the correct instance data')
    })

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
  writeFileAtomicStub.restore()
})

test('When setInstance is invoked and the write fails', t => {
  t.plan(1)
  let getServiceInstancesStub = getStubbedServiceInstances()
  let getSourceInstancesStub = getStubbedSourceInstances()
  const writeFileAtomicStub = badWriteFileAtomicStub()

  setInstance({
    _id: 'b',
    _type: 'foo'
  })
    .catch(err => {
      t.deepEqual(err, {message: 'Something went wrong'}, 'it should reject the promise with the error')
    })

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
  writeFileAtomicStub.restore()
})

test('When setInstance is invoked incorrectly', t => {
  t.plan(15)
  let getServiceInstancesStub = getStubbedServiceInstances()
  let getSourceInstancesStub = getStubbedSourceInstances()

  setInstance({
    _type: 'foo'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject instance missing _id property with the correct error')
      t.equal(err.error.code, 'ESETINSTANCEMISSINGID', 'it should reject instance missing _id property with the correct error code')
      t.equal(err.error.message, 'No id passed for instance', 'it should reject instance missing _id property with the correct error message')
    })

  setInstance({
    _id: 'b'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject instance missing _type property with the correct error')
      t.equal(err.error.code, 'ESETINSTANCEMISSINGTYPE', 'it should reject instance missing _type property with the correct error code')
      t.equal(err.error.message, 'Instance ‘b’ has no type', 'it should reject instance missing _type property with the correct error message')
    })

  setInstance({
    _id: 'z',
    _type: 'foo'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject instance which cannot be found with the correct error')
      t.equal(err.error.code, 'ESETINSTANCEINSTANCENOTFOUND', 'it should reject instance which cannot be found with the correct error code')
      t.equal(err.error.message, 'Instance ‘z’ not found', 'it should reject instance which cannot be found with the correct error message')
    })

  const getDiscreteInstanceStub = stub(serviceData, 'getDiscreteInstance')
  getDiscreteInstanceStub.callsFake(() => {
    return {}
  })

  setInstance({
    _id: 'b',
    _type: 'foo'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject instance which has no source reference with the correct error')
      t.equal(err.error.code, 'ESETINSTANCENOSOURCE', 'it should reject instance which has no source reference with the correct error code')
      t.equal(err.error.message, 'Instance ‘b’ has no source', 'it should reject instance which has no source reference with the correct error message')
    })
  getDiscreteInstanceStub.restore()

  const getSourcePathStub = stub(serviceData, 'getSourcePath')
  getSourcePathStub.callsFake(() => {})

  setInstance({
    _id: 'b',
    _type: 'foo'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject instance whose source is missing with the correct error')
      t.equal(err.error.code, 'ESETINSTANCESOURCENOTFOUND', 'it should reject instance whose source is missing with the correct error code')
      t.equal(err.error.message, 'Source specified for instance ‘b’ does not exist', 'it should reject instance whose source is missing with the correct error message')
    })
  getSourcePathStub.restore()

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
})

test('When setting a property on an instance', t => {
  t.plan(18)
  const getServiceInstancesStub = getStubbedServiceInstances()
  const getSourceInstancesStub = getStubbedSourceInstances()
  const writeFileAtomicStub = goodWriteFileAtomicStub()

  setInstanceProperty('b', 'newProp', 'newValue')
    .then(res => {
      t.equal(res, true, 'it should successfully write the instance file')
      const args = writeFileAtomicStub.getCall(0).args
      t.equal(args[0], '/service-path/metadata/component/a.json', 'it should write to the correct path name')
      const b = jp.query(args[1], '$..[?(@._id === "b")]')[0]
      t.deepEqual(b.newProp, 'newValue', 'it should set the value on the instance')
    })

  setInstanceProperty({_id: 'b'}, 'newProp', 'newValue')
    .then(res => {
      t.equal(res, true, 'it should successfully write the instance file when passed an instance instead of an id')
      const args = writeFileAtomicStub.getCall(0).args
      t.equal(args[0], '/service-path/metadata/component/a.json', 'it should write to the correct path name when passed an instance instead of an id')
      const b = jp.query(args[1], '$..[?(@._id === "b")]')[0]
      t.deepEqual(b.newProp, 'newValue', 'it should set the value on the instance data when passed an instance instead of an id')
    })

  setInstanceProperty(undefined, 'newProp', 'newValue')
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject call with missing id property with the correct error')
      t.equal(err.error.code, 'ESETINSTANCEPROPERTYMISSINGID', 'it should reject call with missing id property with the correct error code')
      t.equal(err.error.message, 'No id passed to setInstanceProperty', 'it should reject call with missing id property with the correct error message')
    })

  setInstanceProperty('b', undefined, 'newValue')
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject call with missing ‘property’ property with the correct error')
      t.equal(err.error.code, 'ESETINSTANCEPROPERTYMISSINGPROPERTY', 'it should reject call with missing ‘property’ property with the correct error code')
      t.equal(err.error.message, 'No property for instance ‘b’ passed to setInstanceProperty', 'it should reject call with missing ‘property’ property with the correct error message')
    })

  setInstanceProperty('b', '_id', 'newValue')
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject call with ‘_id’ property with the correct error')
      t.equal(err.error.code, 'ESETINSTANCEPROPERTYPROTECTED', 'it should reject call with ‘_id’ property with the correct error code')
      t.equal(err.error.message, 'Property ‘_id’ for instance ‘b’ is protected', 'it should reject call with ‘_id’ property with the correct error message')
    })

  setInstanceProperty('b', '_type', 'newValue')
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject call with ‘_type’ property with the correct error')
      t.equal(err.error.code, 'ESETINSTANCEPROPERTYPROTECTED', 'it should reject call with ‘_type’ property with the correct error code')
      t.equal(err.error.message, 'Property ‘_type’ for instance ‘b’ is protected', 'it should reject call with ‘_type’ property with the correct error message')
    })

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
  writeFileAtomicStub.restore()
})

test('When createInstance is invoked as to make a discrete instance', t => {
  t.plan(3)
  const getServiceInstancesStub = getStubbedServiceInstances()
  const getSourceInstancesStub = getStubbedSourceInstances()
  const writeFileAtomicStub = goodWriteFileAtomicStub()

  createInstance({
    _id: 'z',
    _type: 'foo'
  })
    .then(res => {
      t.equal(res, true, 'it should successfully write the instance')
      const args = writeFileAtomicStub.getCall(0).args
      t.equal(args[0], '/service-path/metadata/component/z.json', 'it should write to the correct path name')
      t.deepEqual(args[1], {_id: 'z', _type: 'foo'}, 'it should write the correct instance data')
    })

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
  writeFileAtomicStub.restore()
})

test('When createInstance is invoked to make a nested instance', t => {
  t.plan(12)
  const getServiceInstancesStub = getStubbedServiceInstances()
  const getSourceInstancesStub = getStubbedSourceInstances()
  const writeFileAtomicStub = goodWriteFileAtomicStub()

  const expectedA = {
    _id: 'a',
    _type: 'discrete',
    components: [
      {
        _id: 'b',
        _type: 'nested',
        items: [
          {
            _id: 'c',
            _type: 'deepnested',
            string: '',
            number: 0,
            boolean: false
          }
        ]
      },
      {
        _id: 'z',
        _type: 'foo'
      }
    ]
  }

  createInstance({
    _id: 'z',
    _type: 'foo'
  }, {
    _id: 'a',
    property: 'components'
  })
    .then(res => {
      t.equal(res, true, 'it should successfully write the instance')
      const args = writeFileAtomicStub.getCall(0).args
      t.equal(args[0], '/service-path/metadata/component/a.json', 'it should write to the correct path name')
      t.deepEqual(args[1], expectedA, 'it should write the correct instance data')
    })

  const expectedB = {
    _id: 'a',
    _type: 'discrete',
    components: [
      {
        _id: 'b',
        _type: 'nested',
        items: [
          {
            _id: 'c',
            _type: 'deepnested',
            string: '',
            number: 0,
            boolean: false
          },
          {
            _id: 'z',
            _type: 'foo'
          }
        ]
      }
    ]
  }

  createInstance({
    _id: 'z',
    _type: 'foo'
  }, {
    _id: 'b',
    property: 'items'
  })
    .then(res => {
      t.equal(res, true, 'it should successfully write the instance')
      const args = writeFileAtomicStub.getCall(1).args
      t.equal(args[0], '/service-path/metadata/component/a.json', 'it should write to the correct path name')
      t.deepEqual(args[1], expectedB, 'it should write the correct nested instance data')
    })

  const expectedUnshift = {
    _id: 'a',
    _type: 'discrete',
    components: [
      {
        _id: 'b',
        _type: 'nested',
        items: [
          {
            _id: 'z',
            _type: 'foo'
          },
          {
            _id: 'c',
            _type: 'deepnested',
            string: '',
            number: 0,
            boolean: false
          }
        ]
      }
    ]
  }

  createInstance({
    _id: 'z',
    _type: 'foo'
  }, {
    _id: 'b',
    property: 'items',
    operation: 'unshift'
  })
    .then(res => {
      t.equal(res, true, 'it should successfully write the instance')
      const args = writeFileAtomicStub.getCall(2).args
      t.equal(args[0], '/service-path/metadata/component/a.json', 'it should write to the correct path name')
      t.deepEqual(args[1], expectedUnshift, 'it should write the correct nested instance data')
    })

  const expectedEmpty = {
    _id: 'a',
    _type: 'discrete',
    components: [
      {
        _id: 'b',
        _type: 'nested',
        items: [
          {
            _id: 'c',
            _type: 'deepnested',
            string: '',
            number: 0,
            boolean: false
          }
        ],
        things: [
          {
            _id: 'z',
            _type: 'foo'
          }
        ]
      }
    ]
  }

  createInstance({
    _id: 'z',
    _type: 'foo'
  }, {
    _id: 'b',
    property: 'things'
  })
    .then(res => {
      t.equal(res, true, 'it should successfully write the instance')
      const args = writeFileAtomicStub.getCall(3).args
      t.equal(args[0], '/service-path/metadata/component/a.json', 'it should write to the correct path name')
      t.deepEqual(args[1], expectedEmpty, 'it should write the correct nested instance data')
    })

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
  writeFileAtomicStub.restore()
})

test('When createInstance attempts to create instance that already exists', t => {
  t.plan(6)
  const getServiceInstancesStub = getStubbedServiceInstances()
  const getSourceInstancesStub = getStubbedSourceInstances()

  createInstance({
    _id: 'a',
    _type: 'foo'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject instance that already exists with the correct error')
      t.equal(err.error.code, 'ECREATEINSTANCEINSTANCEEXISTS', 'it should reject instance that already exists with the correct error code')
      t.equal(err.error.message, 'Instance ‘a’ already exists', 'it should reject instance that already exists with the correct error message')
    })

  createInstance({
    _id: 'b',
    _type: 'foo'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject nested instance that already exists with the correct error')
      t.equal(err.error.code, 'ECREATEINSTANCEINSTANCEEXISTS', 'it should reject nested instance that already exists with the correct error code')
      t.equal(err.error.message, 'Instance ‘b’ already exists', 'it should reject nested instance that already exists with the correct error message')
    })

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
})

test('When createInstance is invoked and the write fails', t => {
  t.plan(1)
  let getServiceInstancesStub = getStubbedServiceInstances()
  let getSourceInstancesStub = getStubbedSourceInstances()
  const writeFileAtomicStub = badWriteFileAtomicStub()

  createInstance({
    _id: 'z',
    _type: 'foo'
  })
    .catch(err => {
      t.deepEqual(err, {message: 'Something went wrong'}, 'it should reject the promise with the error')
    })

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
  writeFileAtomicStub.restore()
})

test('When createInstance is invoked incorrectly', t => {
  t.plan(18)
  let getServiceInstancesStub = getStubbedServiceInstances()
  let getSourceInstancesStub = getStubbedSourceInstances()

  createInstance({
    _type: 'foo'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject instance missing _id property with the correct error')
      t.equal(err.error.code, 'ECREATEINSTANCEMISSINGID', 'it should reject instance missing _id property with the correct error code')
      t.equal(err.error.message, 'No id passed for instance', 'it should reject instance missing _id property with the correct error message')
    })

  createInstance({
    _id: 'z'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject instance missing _type property with the correct error')
      t.equal(err.error.code, 'ECREATEINSTANCEMISSINGTYPE', 'it should reject instance missing _type property with the correct error code')
      t.equal(err.error.message, 'Instance ‘z’ has no type', 'it should reject instance missing _type property with the correct error message')
    })

  createInstance({
    _id: 'z',
    _type: 'foo'
  }, {
    _id: 'a'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject instance when instance to add to is missing with the correct error')
      t.equal(err.error.code, 'ECREATEINSTANCEADDNOPROPERTY', 'it should reject instance when instance to add to is missing with the correct error code')
      t.equal(err.error.message, 'Instance ‘a’ specified to add new instance ‘z’ to without any property', 'it should reject instance when instance to add to is missing with the correct error message')
    })

  createInstance({
    _id: 'z',
    _type: 'foo'
  }, {
    _id: 'y',
    property: 'components'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject instance when instance to add to is missing with the correct error')
      t.equal(err.error.code, 'ECREATEINSTANCEADDNOTFOUND', 'it should reject instance when instance to add to is missing with the correct error code')
      t.equal(err.error.message, 'Instance ‘y’ to add new instance ‘z’ to not found', 'it should reject instance when instance to add to is missing with the correct error message')
    })

  const getDiscreteInstanceStub = stub(serviceData, 'getDiscreteInstance')
  getDiscreteInstanceStub.callsFake(() => {
    return {
      _id: 'a'
    }
  })
  createInstance({
    _id: 'z',
    _type: 'foo'
  }, {
    _id: 'a',
    property: 'components'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject instance when instance to add to is missing with the correct error')
      t.equal(err.error.code, 'ECREATEINSTANCEADDNOSOURCE', 'it should reject instance when instance to add to is missing with the correct error code')
      t.equal(err.error.message, 'Instance ‘a’ to add new instance ‘z’ to has no source', 'it should reject instance when instance to add to is missing with the correct error message')
    })
  getDiscreteInstanceStub.restore()

  const getSourcePathStub = stub(serviceData, 'getSourcePath')
  getSourcePathStub.callsFake(() => {})

  createInstance({
    _id: 'z',
    _type: 'foo'
  })
    .catch(err => {
      t.equal(err.name, 'FBServiceDataError', 'it should reject instance whose source is missing with the correct error')
      t.equal(err.error.code, 'ECREATEINSTANCESOURCENOTFOUND', 'it should reject instance whose source is missing with the correct error code')
      t.equal(err.error.message, 'Source specified for instance ‘z’ does not exist', 'it should reject instance whose source is missing with the correct error message')
    })
  getSourcePathStub.restore()

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
})

test('When writing instance file to writable location', t => {
  t.plan(2)
  const tmpFile = `/tmp/instance-${new Date().toString()}.json`
  serviceData.writeFileAtomic(tmpFile, {b: 'b-data', a: 'a-data'}, (err) => {
    if (err) {
      //
    }
    t.ok(true, 'it should write the file successfuly')
    const fileContents = fs.readFileSync(tmpFile).toString()
    t.equal(fileContents, '{\n  "a": "a-data",\n  "b": "b-data"\n}', 'it should jsonify the output and order the keys correctly')
    fs.unlinkSync(tmpFile)
  })
})

test('When writing instance file to unwritable location', t => {
  t.plan(1)
  const tmpFile = `instance-${new Date().toString()}.json`
  serviceData.writeFileAtomic(`/utterlybogus/${tmpFile}`, {a: 'data'}, (err) => {
    if (err) {
      t.pass('it should fail to write the file successfuly')
    }
  })
})

test('When retrieving the path prefix for an instance file', t => {
  t.equal(serviceData.getInstancePathPrefix('page.foo'), 'page', 'it should return page for page instances')
  t.equal(serviceData.getInstancePathPrefix('config.foo'), 'config', 'it should return config for configuration instances')
  t.equal(serviceData.getInstancePathPrefix('string.foo'), 'string', 'it should return string for string instances')
  t.equal(serviceData.getInstancePathPrefix('strings.foo'), 'string', 'it should return string for strings instances')
  t.equal(serviceData.getInstancePathPrefix('foo'), 'component', 'it should return component for all other instances')
  t.end()
})

test('When serviceData object is frozen', t => {
  serviceData.freeze()
  let error
  try {
    serviceData.getServiceSchemas = () => {}
  } catch (e) {
    error = e
  }
  t.ok(error, 'it should throw an error if an attempt is made to reassign any of its properties')
  t.end()
})
