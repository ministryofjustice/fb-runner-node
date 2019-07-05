const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const setDefaultValues = proxyquire('./set-default-values', {
})

const userData = {}

const schemaStubFn = (_id) => {
  if (_id === 'defaultTypeSchema') {
    return {
      properties: {
        defaultTest: {
          default: 'defaultTest default value'
        }
      }
    }
  }
}

test('When updating a page that contains a property that has a default value in its schema and no value has been specified', t => {
  const getServiceSchemaStub = stub(setDefaultValues, 'getServiceSchema')
  getServiceSchemaStub.callsFake(schemaStubFn)
  const pageInstanceWithDefaultValueProps = setDefaultValues({
    _type: 'defaultTypeSchema',
    defaultTest: undefined
  }, userData)
  t.deepEqual(pageInstanceWithDefaultValueProps.defaultTest, 'defaultTest default value', 'it should use the default value')

  getServiceSchemaStub.restore()
  t.end()
})

test('When updating a page that contains a property that has a default value in its schema but a value has been specified', t => {
  const getServiceSchemaStub = stub(setDefaultValues, 'getServiceSchema')
  getServiceSchemaStub.callsFake(schemaStubFn)

  const pageInstanceWithSpecifiedValueProps = setDefaultValues({
    _type: 'defaultTypeSchema',
    defaultTest: 'specified value'
  }, userData)
  t.deepEqual(pageInstanceWithSpecifiedValueProps.defaultTest, pageInstanceWithSpecifiedValueProps.defaultTest, 'it should not overwrite the specified value')

  getServiceSchemaStub.restore()
  t.end()
})

test('When updating a page that contains a property that has no default value in its schema and no value has been specified', t => {
  const getServiceSchemaStub = stub(setDefaultValues, 'getServiceSchema')
  getServiceSchemaStub.callsFake(schemaStubFn)

  const pageInstanceWithNoDefaultForProp = setDefaultValues({
    _type: 'anotherSchema',
    defaultTest: 'specified value'
  }, userData)
  t.deepEqual(pageInstanceWithNoDefaultForProp.defaultTest, pageInstanceWithNoDefaultForProp.defaultTest, 'it should leave the value unspecified')

  getServiceSchemaStub.restore()
  t.end()
})
