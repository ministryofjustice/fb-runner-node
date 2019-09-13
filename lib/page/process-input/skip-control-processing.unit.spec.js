const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const serviceData = require('../../service-data/service-data')
const getServiceSchemaStub = stub(serviceData, 'getServiceSchema')
getServiceSchemaStub.callsFake(_type => {
  const schemas = {
    noProps: {},
    noName: {
      properties: {}
    },
    hasName: {
      properties: {
        name: {}
      }
    },
    hasProcessInput: {
      properties: {
        name: {
          processInput: true
        }
      }
    }
  }
  return schemas[_type]
})

const skipControlProcessing = proxyquire('./skip-control-processing', {
  '../../service-data/service-data': serviceData
})

const userData = {}

const resetStubs = () => {
  getServiceSchemaStub.resetHistory()
}

const pageInstance = {}

test('When processing a fileupload control', t => {
  resetStubs()

  const skip = skipControlProcessing(pageInstance, userData, {_type: 'fileupload'})
  t.equal(skip, true, 'it should skip that control')

  t.end()
})

test('When processing a control with no schema', t => {
  resetStubs()

  const skip = skipControlProcessing(pageInstance, userData, {})
  t.equal(skip, true, 'it should skip that control')

  t.end()
})

test('When processing a control with a schema that has no properties', t => {
  resetStubs()

  const skip = skipControlProcessing(pageInstance, userData, {_type: 'noProps'})
  t.equal(skip, true, 'it should skip that control')

  t.end()
})

test('When processing a control with a schema that has no properties', t => {
  resetStubs()

  const skip = skipControlProcessing(pageInstance, userData, {_type: 'noProps'})
  t.equal(skip, true, 'it should skip that control')

  t.end()
})

test('When processing a control with a schema that does not contain a processInput property', t => {
  resetStubs()

  const skip = skipControlProcessing(pageInstance, userData, {_type: 'hasName'})
  t.equal(skip, true, 'it should skip that control')

  t.end()
})

test('When processing a control with a schema that does contain a processInput property', t => {
  resetStubs()

  const skip = skipControlProcessing(pageInstance, userData, {_type: 'hasProcessInput'})
  t.equal(skip, undefined, 'it should not skip that control')

  t.end()
})
