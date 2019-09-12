const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const CONSTANTS = {}
const serviceData = require('../../service-data/service-data')
const getServiceSchemaStub = stub(serviceData, 'getServiceSchema')
getServiceSchemaStub.callsFake(_type => {
  const schema = {
    properties: {
      name: {}
    }
  }
  if (_type === 'number') {
    schema.properties.name.inputType = 'number'
  }
  return schema
})

const processControlStandard = proxyquire('./process-control-standard', {
  '../../constants/constants': CONSTANTS,
  '../../service-data/service-data': serviceData
})

const errorLoggerStub = stub()
const getBodyInputStub = stub()
const userData = {
  logger: {
    error: errorLoggerStub
  },
  getBodyInput: getBodyInputStub
}

const resetStubs = () => {
  getServiceSchemaStub.resetHistory()
  errorLoggerStub.resetHistory()
  getBodyInputStub.resetHistory()
  getBodyInputStub.returns({})
}

const pageInstance = {}
const nameInstance = {
  name: 'foo'
}
const options = {
  controlName: 'foo'
}

test('When processing a control for which there was no value', t => {
  resetStubs()

  const value = processControlStandard(pageInstance, userData, nameInstance, options)

  t.equal(value, undefined, 'it should return undefined')
  t.end()
})

test('When processing a control for which there was a value', t => {
  resetStubs()
  getBodyInputStub.returns({foo: 'bar'})

  const value = processControlStandard(pageInstance, userData, nameInstance, options)

  t.equal(value, 'bar', 'it should return the expected value')
  t.end()
})

test('When processing a control for which there was a value padded with space characters', t => {
  resetStubs()
  getBodyInputStub.returns({foo: '  bar\t\n'})

  const value = processControlStandard(pageInstance, userData, nameInstance, options)

  t.equal(value, 'bar', 'it should return the expected value')
  t.end()
})

test('When processing a control for which there was a value containing only space characters', t => {
  resetStubs()
  getBodyInputStub.returns({foo: '  \t\n'})

  const value = processControlStandard(pageInstance, userData, nameInstance, options)

  t.equal(value, undefined, 'it should return undefined')
  t.end()
})

test('When processing a control for which there was a value containing only space characters but an empty string is allowed', t => {
  resetStubs()
  getBodyInputStub.returns({foo: ''})

  const value = processControlStandard(pageInstance, userData, {
    name: 'foo',
    acceptsEmptyString: true
  }, options)

  t.equal(value, '', 'it should return the empty value')
  t.end()
})

test('When processing a control for which the value should be a number', t => {
  resetStubs()
  getBodyInputStub.returns({foo: '10'})

  const numberInstance = {
    _type: 'number',
    name: 'foo'
  }

  const value = processControlStandard(pageInstance, userData, numberInstance, options)

  t.equal(value, 10, 'it should return a valid value as a number')

  getBodyInputStub.returns({foo: '0'})

  const zeroValue = processControlStandard(pageInstance, userData, numberInstance, options)

  t.equal(zeroValue, 0, 'it should return ‘0’ as a number')

  getBodyInputStub.returns({foo: 'a0'})

  const invalidValue = processControlStandard(pageInstance, userData, numberInstance, options)

  t.equal(invalidValue, 'a0', 'it should return an invalid value as is')
  t.end()
})

test('When processing a control for which the value provided is an array', t => {
  resetStubs()
  getBodyInputStub.returns({foo: ['10']})

  try {
    t.throw(processControlStandard(pageInstance, userData, nameInstance, options), 'it should throw an error')
  } catch (e) {
    t.ok(errorLoggerStub.calledOnce, 'it should log the error')
    t.deepEqual(errorLoggerStub.args[0], [{name: 'foo'}, 'Input name is not unique for the request'], 'it should call the logger emthod with the expected args')
    t.equal(e.name, 'FBProcessInputError', 'it should throw a FBProcessInputError')
    t.equal(e.code, 'EDUPLICATEINPUTNAME', 'it should add the expected code')
    t.equal(e.message, 'Input name foo is not unique', 'it should throw a FBProcessInputError')
    t.deepEqual(e.renderError, {
      heading: 'Input name foo is not unique',
      lede: 'The form will not work correctly unless you fix this problem'
    }, 'it should add a renderError object to the error')
  }

  t.end()
})
