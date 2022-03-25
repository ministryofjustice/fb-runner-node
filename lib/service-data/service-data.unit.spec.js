const test = require('tape')
const { stub } = require('sinon')
const jp = require('jsonpath')

const fs = require('fs')

const cloneDeep = require('lodash.clonedeep')

const serviceData = require('./service-data')
const {
  getTimestamp,
  loadServiceData,
  setServiceSchemas,
  getServiceSchemas,
  getSchemaCategories,
  getSchemaNameByCategory,
  getSchemaPropertyAllowableTypes,
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
  getSourceInstanceProperty,
  expandInstance,
  getInstanceTitle,
  getInstanceTitleSummary
} = serviceData

test('When getInstanceTitle is invoked', t => {
  const labelInstance = 'someLabel'

  function setTextOnInstance (texts) {
    setServiceInstances(cloneDeep({
      [labelInstance]: {
        ...texts
      }
    }))
  }

  setTextOnInstance({
    textSummary: 'summary text',
    heading: 'some heading'
  })
  t.equal(getInstanceTitle(labelInstance), 'some heading', 'shouldn\'t use any summary text without specifying the isSummary signature')
  t.equal(getInstanceTitle(labelInstance, true), 'summary text', 'should use the summary text when available')

  setTextOnInstance({
    label: 'some label',
    heading: 'some heading'
  })
  t.equal(getInstanceTitle(labelInstance), 'some heading', 'should prefer headings over labels')

  setTextOnInstance({})
  t.equal(getInstanceTitle(labelInstance), labelInstance, 'should return the ID if no text could be found')

  setTextOnInstance({
    title: 'some title',
    text: 'some text'
  })
  t.equal(getInstanceTitle(labelInstance), 'some title', 'should prefer the title over the text property')

  t.end()
})

test('When getInstanceTitleSummary is invoked', t => {
  const labelInstance = 'someLabel'

  function setTextOnInstance (texts) {
    setServiceInstances(cloneDeep({
      [labelInstance]: {
        ...texts
      }
    }))
  }

  setTextOnInstance({ textSummary: 'summary text' })
  t.equal(getInstanceTitleSummary(labelInstance), 'summary text', 'should use the summary text when available')

  setTextOnInstance({
    labelSummary: 'summary label',
    textSummary: 'summary text'
  })
  t.equal(getInstanceTitleSummary(labelInstance), 'summary label', 'should use the summary label over the summary text')

  setTextOnInstance({
    labelSummary: 'summary label',
    legendSummary: 'summary legend',
    textSummary: 'summary text'
  })
  t.equal(getInstanceTitleSummary(labelInstance), 'summary legend', 'should use the summary legend over the label and text')

  setTextOnInstance({
    title: 'some title'
  })
  t.equal(getInstanceTitleSummary(labelInstance), 'some title', 'should resort to a title when no summary text is provided')

  t.end()
})

test('When userData is required ', t => {
  t.equal(typeof getTimestamp, 'function', 'it should export the getTimestamp method')
  t.equal(typeof loadServiceData, 'function', 'it should export the loadServiceData method')
  t.equal(typeof setServiceSchemas, 'function', 'it should export the setServiceSchemas method')
  t.equal(typeof getServiceSchemas, 'function', 'it should export the getServiceSchemas method')
  t.equal(typeof getSchemaCategories, 'function', 'it should export the getSchemaCategories method')
  t.equal(typeof getSchemaNameByCategory, 'function', 'it should export the getSchemaNameByCategory method')
  t.equal(typeof getSchemaPropertyAllowableTypes, 'function', 'it should export the getSchemaPropertyAllowableTypes method')
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
  t.equal(typeof expandInstance, 'function', 'it should export the expandInstance method')
  t.equal(typeof getInstanceTitle, 'function', 'it should export the getInstanceTitle method')
  t.equal(typeof getInstanceTitleSummary, 'function', 'it should export the getInstanceTitleSummary method')
  t.end()
})

test('When service data is loaded', t => {
  t.plan(4)
  const getServiceSourcesStub = stub(serviceData, 'getServiceSources')
  getServiceSourcesStub.callsFake(() => {
    return 'sources'
  })
  const getServiceSchemasStub = stub(serviceData, 'getServiceSchemas')
  getServiceSchemasStub.callsFake(() => {
    return 'schemas'
  })
  const getRuntimeDataStub = stub(serviceData, 'getRuntimeData')
  getRuntimeDataStub.callsFake(() => Promise.resolve('runtimeData'))

  const setServiceInstancesStub = stub(serviceData, 'setServiceInstances')
  setServiceInstancesStub.callsFake(() => {
    return 'serviceInstances'
  })

  loadServiceData().then(() => {
    t.equal(getServiceSourcesStub.calledOnce, true, 'it should load the instances from source')
    t.equal(getServiceSchemasStub.calledOnce, true, 'it should load the schemas')
    t.equal(getRuntimeDataStub.calledOnceWithExactly('sources', 'schemas'), true, 'it should turn the source instances into runtime instances')
    t.equal(setServiceInstancesStub.calledOnceWithExactly('runtimeData'), true, 'it should turn the source instances into runtime instances')

    getServiceSourcesStub.restore()
    getServiceSchemasStub.restore()
    getRuntimeDataStub.restore()
    setServiceInstancesStub.restore()
  })
})

test('When the service schemas have been set', t => {
  t.plan(11)

  const schemas = {
    a: {
      _name: 'a',
      $id: 'http://a',
      category: ['rock']
    },
    b: {
      _name: 'b',
      $id: 'http://b',
      category: ['rock', 'paper', 'definition'],
      properties: {
        bnested: {
          items: {
            _name: 'c',
            $ref: 'http://c'
          }
        }
      }
    },
    c: {
      _name: 'b',
      $id: 'http://c',
      properties: {
        cnested: {
          items: {
            _name: 'definition.rock',
            $ref: 'http://definition/rock'
          }
        }
      }
    },
    'definition.rock': {
      _name: 'definition.rock',
      $id: 'http://definition/rock'
    }
  }
  setServiceSchemas(schemas)

  t.same(getServiceSchemas(), schemas, 'getServiceSchemas should return all the schemas')
  t.same(getServiceSchema('a'), schemas.a, 'getServiceSchema should return the individual schema requested')

  let error
  try {
    setServiceSchemas()
  } catch (e) {
    error = e
  }

  t.equals(error.name, 'ServiceDataError', 'setServiceSchemas should throw an error if an attempt is made to set the schemas again')
  t.equals(error.message, 'Attempt to set frozen service schemas', 'setServiceSchemas should return the correct error message')
  t.equals(error.code, 'ESERVICESCHEMASFROZEN', 'setServiceSchemas should return the correct error code')

  t.same(getServiceSchemas(), schemas, 'getServiceSchemas should still return all the original schemas after a failed attempt to set the schemas')

  t.same(getSchemaCategories(), {
    rock: ['a', 'b'],
    paper: ['b']
  }, 'it should return the correct schema categories')

  t.same(getSchemaNameByCategory('rock'), ['a', 'b'], 'getSchemaNameByCategory should return the correct schema names for a category')

  t.same(getSchemaNameByCategory('scissors'), [], 'getSchemaNameByCategory should return an empty array if the category has no schemas')

  t.same(getSchemaPropertyAllowableTypes('b', 'bnested'), ['c'], 'getSchemaPropertyAllowableTypes should return correct allowable types for a property')

  t.same(getSchemaPropertyAllowableTypes('c', 'cnested'), ['a', 'b'], 'getSchemaPropertyAllowableTypes should return correct allowable types for a property that resolves to a definition')

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

  setServiceSources(cloneDeep(sourceObjs))

  t.same(getServiceSources(), sourceObjs, 'getServiceSources should return all the sources')

  let error
  try {
    setServiceSources()
  } catch (e) {
    error = e
  }

  t.equals(error.name, 'ServiceDataError', 'setServiceSources should throw an error if an attempt is made to set the sources again')
  t.equals(error.message, 'Attempt to set frozen service sources', 'setServiceSources should return the correct error message')
  t.equals(error.code, 'ESERVICESOURCESFROZEN', 'setServiceSources should return the correct error code')

  t.same(getServiceSources(), sourceObjs, 'getServiceSources should still return all the original sources after a failed attempt to set the sources')
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
  setServiceInstances(cloneDeep(instances))
  const timestampA = getTimestamp()
  t.ok(timestampA, 'getTimestamp should return a timestamp value')
  t.same(getServiceInstances(), instances, 'getServiceInstances should return all the instances')
  t.same(getInstance('a'), instances.a, 'getInstance should return the individual instance requested')
  t.same(getInstance('b'), instances.b, 'getInstance should return the individual instance requested (part 2)')
  t.same(getInstance('c'), undefined, 'getInstance should return undefined if individual instance requested does not exist')
  t.same(getSourceInstance('a', 'service'), instances.sourceInstances.data.service.a, 'getSourceInstance should return the individual instance requested')
  t.same(getSourceInstance('b', 'core'), instances.sourceInstances.data.core.b, 'getSourceInstance should return the individual instance requested (part 2)')
  t.same(getSourceInstance('c', 'service'), undefined, 'getSourceInstance should return undefined if individual instance requested does not exist')

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
  setServiceInstances(cloneDeep(newInstances), true)
  const timestampB = getTimestamp()
  t.notEqual(timestampA, timestampB, 'getTimestamp should return a changed timestamp value')
  t.same(getInstance('a'), newInstances.a, 'getInstance should return the individual instance requested')
  t.same(getInstance('b'), undefined, 'getInstance should return the individual instance requested (part 2)')
  t.same(getInstance('c'), newInstances.c, 'getInstance should return undefined if individual instance requested')
  t.same(getSourceInstance('a', 'core'), newInstances.sourceInstances.data.core.a, 'getSourceInstance should return the individual instance requested')
  t.same(getSourceInstance('c', 'service'), newInstances.sourceInstances.data.service.c, 'getSourceInstance should return the individual instance requested (part 2)')
  t.same(getSourceInstance('b', 'service'), undefined, 'getSourceInstance should return undefined if individual instance requested does not exist')
  t.same(getSourceInstance('b', 'missing'), undefined, 'getSourceInstance should return undefined if source does not exist')

  let error
  try {
    setServiceInstances({ d: { _id: 'd' }, e: { _id: 'e' } }, true)
  } catch (e) {
    error = e
  }

  const timestampC = getTimestamp()
  t.equal(timestampB, timestampC, 'getTimestamp should return an unchanged timestamp value')
  t.equals(error.name, 'ServiceDataError', 'setServiceInstances should throw an error if an attempt is made to set the schemas again')
  t.equals(error.message, 'Attempt to set frozen service data', 'setServiceInstances should return the correct error message')
  t.equals(error.code, 'ESERVICEDATAFROZEN', 'setServiceInstances should return the correct error code')

  t.same(getServiceInstances(), newInstances, 'getServiceSchemas should still return all the original schemas after a failed attempt to set the schemas')

  t.end()
})

const getStubbedServiceInstances = () => {
  const getServiceInstancesStub = stub(serviceData, 'getServiceInstances')
  getServiceInstancesStub.callsFake(() => {
    return cloneDeep(instances)
  })
  return getServiceInstancesStub
}
const getStubbedSourceInstances = () => {
  const getSourceInstancesStub = stub(serviceData, 'getSourceInstances')
  getSourceInstancesStub.callsFake(() => {
    return cloneDeep(sourceInstances)
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
    return errFn({ message: 'Something went wrong' })
  })
  return writeFileAtomicStub
}
// Mock out directory creation - error from write will expose any failure
const ensureInstanceDirectoryStub = stub(serviceData, 'ensureInstanceDirectory')
ensureInstanceDirectoryStub.callsFake(() => {})

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
      }, {
        _id: 'e',
        _isa: 'm',
        _type: 'foo',
        items: [{
          _id: 'n',
          _type: 'isa_nested'
        }]
      }]
    }]
  },
  m: {
    $source: 'service',
    _id: 'm',
    _type: 'foo',
    items: [{
      _id: 'n',
      _type: 'isa_nested'
    }]
  }
}

test('When getInstance is invoked', t => {
  const getServiceInstancesStub = getStubbedServiceInstances()

  t.same(getInstance('a'), instances.a, 'it should return top level instance if an instance exists')
  t.same(getInstance('b'), instances.a.components[0], 'it should return nested instance if an instance exists')
  t.same(getInstance('c'), instances.a.components[0].items[0], 'it should return deeper nested instance if an instance exists')
  t.equal(getInstance('d'), undefined, 'it should return undefined if no instance exists')

  getServiceInstancesStub.restore()
  t.end()
})

test('When getDiscreteInstance is invoked', t => {
  const getServiceInstancesStub = getStubbedServiceInstances()
  const getSourceInstanceStub = stub(serviceData, 'getSourceInstance')
  getSourceInstanceStub.callsFake((_id, source) => {
    if (source === 'service') {
      return sourceInstances.service[_id]
    }
  })

  t.same(getDiscreteInstance('a'), instances.a, 'it should return top level instance if top level instance matched')
  t.same(getDiscreteInstance('b'), instances.a, 'it should return top level instance if a nested instance matched')
  t.same(getDiscreteInstance('c'), instances.a, 'it should return top level instance if a deeper nested instance matched')
  t.equal(getDiscreteInstance('d'), undefined, 'it should return undefined if no instance exists')

  t.same(getDiscreteInstance('n'), instances.m, 'it should return correct top level instance')

  getServiceInstancesStub.restore()
  getSourceInstanceStub.restore()
  t.end()
})

test('When getInstanceProperty is invoked', t => {
  const getServiceInstancesStub = getStubbedServiceInstances()

  t.equal(getInstanceProperty('a', '_id'), 'a', 'it should return the property of top level instance ')
  t.same(getInstanceProperty('b', 'items'), instances.a.components[0].items, 'it should return property of a nested instance')
  t.equal(getInstanceProperty('c', '_type'), 'deepnested', 'it should return the property of a deeper nested instance')
  t.equal(getInstanceProperty('c', 'monkey'), undefined, 'it should return undefined if property does not exist')
  t.equal(getInstanceProperty('c', 'monkey', 'defaultValue'), 'defaultValue', 'it should return any default value if property does not exist')
  t.equal(getInstanceProperty('c', 'string', 'defaultValue'), '', 'it should return empty string rather than any default value')
  t.equal(getInstanceProperty('c', 'number', 'defaultValue'), 0, 'it should return zero rather than any default value')
  t.equal(getInstanceProperty('c', 'boolean', 'defaultValue'), false, 'it should return false rather than any default value')
  t.equal(getInstanceProperty('d', 'prop'), undefined, 'it should return undefined if no instance exists')

  t.equal(getInstanceProperty('c', ['_type', 'number']), 'deepnested', 'it should first matching defined value - string')
  t.equal(getInstanceProperty('c', ['number', '_type']), 0, 'it should first matching defined value - number')
  t.equal(getInstanceProperty('c', ['string', '_type']), '', 'it should first matching defined value - empty string')
  t.equal(getInstanceProperty('c', ['monkey', 'dog']), undefined, 'it should return undefined if none of the properties exist')
  t.equal(getInstanceProperty('c', ['monkey', 'dog'], 'defaultValue'), 'defaultValue', 'it should return any default value if none of the properties exist')

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
    },
    m: {
      _id: 'm',
      _type: 'foo',
      items: [{
        _id: 'n',
        _type: 'isa_nested'
      }]
    }
  }
}

test('When getSourceInstance is invoked', t => {
  const getSourceInstancesStub = getStubbedSourceInstances()

  t.same(getSourceInstance('a', 'service'), sourceInstances.service.a, 'it should return top level instance if an instance exists')
  t.same(getSourceInstance('b', 'service'), sourceInstances.service.a.components[0], 'it should return nested instance if an instance exists')
  t.same(getSourceInstance('c', 'service'), sourceInstances.service.a.components[0].items[0], 'it should return deeper nested instance if an instance exists')
  t.same(getSourceInstance('n', 'service'), sourceInstances.service.m.items[0], 'it should the correct source instance rather than any expanded one')
  t.equal(getSourceInstance('d', 'service'), undefined, 'it should return undefined if no instance exists')
  t.equal(getSourceInstance('a', 'missing'), undefined, 'it should return undefined if no source data exists')

  getSourceInstancesStub.restore()
  t.end()
})

test('When getDiscreteInstance is invoked', t => {
  const getSourceInstancesStub = getStubbedSourceInstances()

  const getInstanceStub = stub(serviceData, 'getInstance')
  getInstanceStub.callsFake((_id) => {
    return instances[_id]
  })
  const getSourceInstanceStub = stub(serviceData, 'getSourceInstance')
  getSourceInstanceStub.callsFake((_id, source = 'service') => {
    if (source === 'service') {
      return sourceInstances.service[_id]
    }
  })

  t.same(getSourceDiscreteInstance('a', 'service'), sourceInstances.service.a, 'it should return top level instance if top level instance matched')
  t.same(getSourceDiscreteInstance('b', 'service'), sourceInstances.service.a, 'it should return top level instance if a nested instance matched')
  t.same(getSourceDiscreteInstance('c', 'service'), sourceInstances.service.a, 'it should return top level instance if a deeper nested instance matched')
  t.equal(getSourceDiscreteInstance('d', 'service'), undefined, 'it should return undefined if no instance exists')
  t.equal(getSourceDiscreteInstance('a', 'missing'), undefined, 'it should return undefined if no source data exists')

  getSourceInstancesStub.restore()
  getInstanceStub.restore()
  getSourceInstanceStub.restore()
  t.end()
})

test('When getSourceInstanceProperty is invoked', t => {
  const getSourceInstancesStub = getStubbedSourceInstances()

  t.equal(getSourceInstanceProperty('a', '_id', 'service'), 'a', 'it should return the property of top level instance ')
  t.same(getSourceInstanceProperty('b', 'items', 'service'), sourceInstances.service.a.components[0].items, 'it should return property of a nested instance')
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
      t.same(args[1], { _id: 'a', _type: 'foo' }, 'it should write the correct instance data')
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
      t.same(args[1], { _id: 'a', _type: 'discrete', components: [{ _id: 'b', _type: 'middle' }] }, 'it should write the correct instance data')
    })

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
  writeFileAtomicStub.restore()
})

test('When setInstance is invoked and the write fails', t => {
  t.plan(1)
  const getServiceInstancesStub = getStubbedServiceInstances()
  const getSourceInstancesStub = getStubbedSourceInstances()
  const writeFileAtomicStub = badWriteFileAtomicStub()

  setInstance({
    _id: 'b',
    _type: 'foo'
  })
    .catch(err => {
      t.same(err, { message: 'Something went wrong' }, 'it should reject the promise with the error')
    })

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
  writeFileAtomicStub.restore()
})

test('When setInstance is invoked incorrectly', t => {
  t.plan(15)
  const getServiceInstancesStub = getStubbedServiceInstances()
  const getSourceInstancesStub = getStubbedSourceInstances()

  setInstance({
    _type: 'foo'
  })
    .catch(err => {
      t.equal(err.name, 'ServiceDataError', 'it should reject instance missing _id property with the correct error')
      t.equal(err.error.code, 'ESETINSTANCEMISSINGID', 'it should reject instance missing _id property with the correct error code')
      t.equal(err.error.message, 'No id passed for instance', 'it should reject instance missing _id property with the correct error message')
    })

  setInstance({
    _id: 'b'
  })
    .catch(err => {
      t.equal(err.name, 'ServiceDataError', 'it should reject instance missing _type property with the correct error')
      t.equal(err.error.code, 'ESETINSTANCEMISSINGTYPE', 'it should reject instance missing _type property with the correct error code')
      t.equal(err.error.message, 'Instance ‘b’ has no type', 'it should reject instance missing _type property with the correct error message')
    })

  setInstance({
    _id: 'z',
    _type: 'foo'
  })
    .catch(err => {
      t.equal(err.name, 'ServiceDataError', 'it should reject instance which cannot be found with the correct error')
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
      t.equal(err.name, 'ServiceDataError', 'it should reject instance which has no source reference with the correct error')
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
      t.equal(err.name, 'ServiceDataError', 'it should reject instance whose source is missing with the correct error')
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
      t.same(b.newProp, 'newValue', 'it should set the value on the instance')
    })

  setInstanceProperty({ _id: 'b' }, 'newProp', 'newValue')
    .then(res => {
      t.equal(res, true, 'it should successfully write the instance file when passed an instance instead of an id')
      const args = writeFileAtomicStub.getCall(0).args
      t.equal(args[0], '/service-path/metadata/component/a.json', 'it should write to the correct path name when passed an instance instead of an id')
      const b = jp.query(args[1], '$..[?(@._id === "b")]')[0]
      t.same(b.newProp, 'newValue', 'it should set the value on the instance data when passed an instance instead of an id')
    })

  setInstanceProperty(undefined, 'newProp', 'newValue')
    .catch(err => {
      t.equal(err.name, 'ServiceDataError', 'it should reject call with missing id property with the correct error')
      t.equal(err.error.code, 'ESETINSTANCEPROPERTYMISSINGID', 'it should reject call with missing id property with the correct error code')
      t.equal(err.error.message, 'No id passed to setInstanceProperty', 'it should reject call with missing id property with the correct error message')
    })

  setInstanceProperty('b', undefined, 'newValue')
    .catch(err => {
      t.equal(err.name, 'ServiceDataError', 'it should reject call with missing ‘property’ property with the correct error')
      t.equal(err.error.code, 'ESETINSTANCEPROPERTYMISSINGPROPERTY', 'it should reject call with missing ‘property’ property with the correct error code')
      t.equal(err.error.message, 'No property for instance ‘b’ passed to setInstanceProperty', 'it should reject call with missing ‘property’ property with the correct error message')
    })

  setInstanceProperty('b', '_id', 'newValue')
    .catch(err => {
      t.equal(err.name, 'ServiceDataError', 'it should reject call with ‘_id’ property with the correct error')
      t.equal(err.error.code, 'ESETINSTANCEPROPERTYPROTECTED', 'it should reject call with ‘_id’ property with the correct error code')
      t.equal(err.error.message, 'Property ‘_id’ for instance ‘b’ is protected', 'it should reject call with ‘_id’ property with the correct error message')
    })

  setInstanceProperty('b', '_type', 'newValue')
    .catch(err => {
      t.equal(err.name, 'ServiceDataError', 'it should reject call with ‘_type’ property with the correct error')
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
      t.same(args[1], { _id: 'z', _type: 'foo' }, 'it should write the correct instance data')
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
      t.same(args[1], expectedA, 'it should write the correct instance data')
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
      t.same(args[1], expectedB, 'it should write the correct nested instance data')
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
      t.same(args[1], expectedUnshift, 'it should write the correct nested instance data')
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
      t.same(args[1], expectedEmpty, 'it should write the correct nested instance data')
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
      t.equal(err.name, 'ServiceDataError', 'it should reject instance that already exists with the correct error')
      t.equal(err.error.code, 'ECREATEINSTANCEINSTANCEEXISTS', 'it should reject instance that already exists with the correct error code')
      t.equal(err.error.message, 'Instance ‘a’ already exists', 'it should reject instance that already exists with the correct error message')
    })

  createInstance({
    _id: 'b',
    _type: 'foo'
  })
    .catch(err => {
      t.equal(err.name, 'ServiceDataError', 'it should reject nested instance that already exists with the correct error')
      t.equal(err.error.code, 'ECREATEINSTANCEINSTANCEEXISTS', 'it should reject nested instance that already exists with the correct error code')
      t.equal(err.error.message, 'Instance ‘b’ already exists', 'it should reject nested instance that already exists with the correct error message')
    })

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
})

test('When createInstance is invoked and the write fails', t => {
  t.plan(1)
  const getServiceInstancesStub = getStubbedServiceInstances()
  const getSourceInstancesStub = getStubbedSourceInstances()
  const writeFileAtomicStub = badWriteFileAtomicStub()

  createInstance({
    _id: 'z',
    _type: 'foo'
  })
    .catch(err => {
      t.same(err, { message: 'Something went wrong' }, 'it should reject the promise with the error')
    })

  getServiceInstancesStub.restore()
  getSourceInstancesStub.restore()
  writeFileAtomicStub.restore()
})

test('When createInstance is invoked incorrectly', t => {
  t.plan(18)
  const getServiceInstancesStub = getStubbedServiceInstances()
  const getSourceInstancesStub = getStubbedSourceInstances()

  createInstance({
    _type: 'foo'
  })
    .catch(err => {
      t.equal(err.name, 'ServiceDataError', 'it should reject instance missing _id property with the correct error')
      t.equal(err.error.code, 'ECREATEINSTANCEMISSINGID', 'it should reject instance missing _id property with the correct error code')
      t.equal(err.error.message, 'No id passed for instance', 'it should reject instance missing _id property with the correct error message')
    })

  createInstance({
    _id: 'z'
  })
    .catch(err => {
      t.equal(err.name, 'ServiceDataError', 'it should reject instance missing _type property with the correct error')
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
      t.equal(err.name, 'ServiceDataError', 'it should reject instance when instance to add to is missing with the correct error')
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
      t.equal(err.name, 'ServiceDataError', 'it should reject instance when instance to add to is missing with the correct error')
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
      t.equal(err.name, 'ServiceDataError', 'it should reject instance when instance to add to is missing with the correct error')
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
      t.equal(err.name, 'ServiceDataError', 'it should reject instance whose source is missing with the correct error')
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
  serviceData.writeFileAtomic(tmpFile, { b: 'b-data', a: 'a-data' }, (err) => {
    t.notOk(err, 'it should not throw an error')
    t.notOk(err, 'it should not throw an error')
  }, (err) => {
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
  serviceData.writeFileAtomic(`/utterlybogus/${tmpFile}`, { a: 'data' }, (err) => {
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

test('When expanding an instance', t => {
  // t.plan(4)
  const getDiscreteInstanceStub = stub(serviceData, 'getDiscreteInstance')
  getDiscreteInstanceStub.callsFake((_id) => {
    if (_id === 'inherit') {
      return {
        _id: 'inherit',
        $source: 'ok'
      }
    }
    if (_id === 'missing') {
      return {
        _id: 'missing',
        $source: 'missing'
      }
    }
  })
  const getSourceInstanceStub = stub(serviceData, 'getSourceInstance')
  getSourceInstanceStub.callsFake((_id, source) => {
    if (source === 'ok') {
      return {
        _id: 'inherit',
        _type: 'monkey',
        heading: 'inherited heading',
        label: 'inherited label'
      }
    }
  })

  const addErrorStub = stub()

  t.same(expandInstance({
    _id: 'expando',
    _type: 'expandoType',
    _isa: 'inherit'
  }, addErrorStub), {
    _id: 'expando',
    _type: 'expandoType',
    _isa: 'inherit',
    heading: 'inherited heading',
    label: 'inherited label'
  }, 'it should merge the values from the inherited instance')

  t.same(expandInstance({
    _id: 'expando',
    _type: 'expandoType',
    _isa: 'inherit',
    label: 'overridden label'
  }, addErrorStub), {
    _id: 'expando',
    _type: 'expandoType',
    _isa: 'inherit',
    heading: 'inherited heading',
    label: 'overridden label'
  }, 'it should honour values already set in the instance')

  t.same(expandInstance({
    _id: 'expando',
    _type: 'expandoType',
    _isa: 'missing',
    label: 'overridden label'
  }, addErrorStub), {
    _id: 'expando',
    _type: 'expandoType',
    _isa: 'missing',
    label: 'overridden label'
  }, 'it should merge the inherited values')
  t.equal(addErrorStub.calledOnceWithExactly('instance.isa.source.missing', 'instance'), true, 'it should register that the source for the instance referenced cannot be found')
  addErrorStub.resetHistory()

  t.same(expandInstance({
    _id: 'expando',
    _type: 'expandoType',
    _isa: 'nonexistent',
    label: 'overridden label'
  }, addErrorStub), {
    _id: 'expando',
    _type: 'expandoType',
    _isa: 'nonexistent',
    label: 'overridden label'
  }, 'it should merge the inherited values')
  t.equal(addErrorStub.calledOnceWithExactly('instance.isa.missing', 'instance'), true, 'it should register that the instance referenced cannot be found')

  getDiscreteInstanceStub.restore()
  getSourceInstanceStub.restore()
  t.end()
})

test('When serviceData object is frozen', t => {
  serviceData.foo = false
  serviceData.freeze()
  serviceData.foo = true
  t.equal(serviceData.foo, false, 'it should not allow any properties to be updated')
  t.end()
})
