require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const { stub } = require('sinon')
const proxyquire = require('proxyquire')

const cloneDeep = require('lodash.clonedeep')

const getComponentCompositeStub = stub()
getComponentCompositeStub.returns()

const {
  isRequired,
  validateRequired,
  validateInstanceRequired
} = proxyquire('./validate-required', {
  '~/fb-runner-node/controller/component/common/get-composite': getComponentCompositeStub
})
const { getUserDataMethods } = require('~/fb-runner-node/middleware/user-data/user-data')
const getUserData = (input) => getUserDataMethods({ input })

const textNameInstances = [{
  _id: 'a',
  _type: 'text',
  name: 'test-a'
}]
const pageInstance = {
  components: textNameInstances
}

const valueUserData = getUserData({
  'test-a': 'ok'
})
const undefinedValueUserData = getUserData({})
const emptyValueUserData = getUserData({
  'test-a': '  '
})

test('When validateInput is required ', t => {
  t.equal(typeof validateRequired, 'function', 'it should export a function')
  t.end()
})

test('When validating a page instance which has a required control', t => {
  const getServiceSchemaStub = stub(validateRequired, 'getServiceSchema')
  getServiceSchemaStub.callsFake(() => {
    // schema.properties || !schema.properties.name || !schema.properties.name.processInput
    return {
      properties: {
        name: {
          processInput: true
        },
        value: {
          default: 'default-val'
        }
      }
    }
  })
  t.deepEqual(validateRequired(pageInstance, valueUserData).length, 0, 'it should not return an error if it has a value')

  t.deepEqual(validateRequired(pageInstance, undefinedValueUserData).length, 1, 'it should return an error if it has no value')

  t.deepEqual(validateRequired(pageInstance, emptyValueUserData).length, 1, 'it should return an error if it has a value but that value is only white space')
  getServiceSchemaStub.restore()
  t.end()
})

test('When validating an instance which has no required controls', t => {
  const getServiceSchemaStub = stub(validateRequired, 'getServiceSchema')
  getServiceSchemaStub.callsFake(() => {
    return {
      properties: {
        value: {
          default: 'default-checkbox-val'
        }
      }
    }
  })

  const notRequiredPageInstance = {
    components: [{
      _id: 'a',
      _type: 'text',
      name: 'test-a',
      validation: {
        required: false
      }
    }]
  }

  t.deepEqual(validateRequired(notRequiredPageInstance, undefinedValueUserData).length, 0, 'it should not return an error if it has no value')
  getServiceSchemaStub.restore()
  t.end()
})

test('When validating a page instance containing a checkbox instance', t => {
  const getServiceSchemaStub = stub(validateRequired, 'getServiceSchema')
  getServiceSchemaStub.callsFake(() => {
    return {
      properties: {
        value: {
          default: 'default-checkbox-val'
        }
      }
    }
  })

  const checkboxNameInstances = [{
    _id: 'a',
    _type: 'checkbox',
    name: 'test-a'
  }]
  const pageInstance = {}

  t.deepEqual(validateRequired(checkboxNameInstances, pageInstance, undefinedValueUserData).length, 0, 'it should not return an error')

  getServiceSchemaStub.restore()

  t.end()
})

test('When validating a page containing a checkboxes instance', t => {
  const getServiceSchemaStub = stub(validateRequired, 'getServiceSchema')
  getServiceSchemaStub.callsFake(() => {
    return {
      properties: {
        value: {
          default: 'default-checkbox-val'
        }
      }
    }
  })

  const pageInstance = {
    components: [{
      _id: 'a',
      _type: 'checkboxes',
      items: [{
        _id: 'b',
        _type: 'checkbox',
        name: 'test-b',
        value: 'yes-b'
      }, {
        _id: 'c',
        _type: 'checkbox',
        name: 'test-c',
        value: 'yes-c'
      }, {
        _id: 'd',
        _type: 'checkbox',
        name: 'test-d'
      }]
    }]
  }

  t.deepEqual(validateRequired(pageInstance, undefinedValueUserData).length, 0, 'it should not return an error if the checkboxes instance is not required')

  const requiredCheckboxPageInstance = cloneDeep(pageInstance)
  requiredCheckboxPageInstance.components[0].validation = { required: true }

  t.deepEqual(validateRequired(requiredCheckboxPageInstance, undefinedValueUserData).length, 1, 'it should return an error if the checkboxes instance is required and none of its items have a value')

  const valueUserData = getUserData({
    'test-b': 'yes-b'
  })
  t.deepEqual(validateRequired(requiredCheckboxPageInstance, valueUserData).length, 0, 'it should return an error if the checkboxes instance is required and any of its items have a value')

  const wrongValueUserData = getUserData({
    'test-b': 'yes-c'
  })
  t.deepEqual(validateRequired(requiredCheckboxPageInstance, wrongValueUserData).length, 1, 'it should return an error if the checkboxes instance is required and any of its items have a value ')

  const testUserData = getUserData({
    'test-d': 'default-checkbox-val'
  })

  t.deepEqual(validateRequired(requiredCheckboxPageInstance, testUserData).length, 0, 'it should not throw an error and it should use schema-provided default values when no checkbox value is provided')

  getServiceSchemaStub.restore()
  t.end()
})

test('When validating instances that have hard-coded required values from their schemas', t => {
  const nameInstances = [{
    _id: 'a',
    _type: 'hidden',
    name: 'test-a'
  }]
  const userData = getUserData({
    'test-a': undefined
  })

  const getServiceSchemaStub = stub(validateRequired, 'getServiceSchema')
  getServiceSchemaStub.callsFake(() => {
    return {
      validation: {
        required: false
      },
      properties: {
        value: {
          default: 'some-default-value'
        }
      }
    }
  })
  const expected = []
  t.deepEqual(validateRequired(nameInstances, userData), expected, 'it should return no errors when validating a valid instance')

  getServiceSchemaStub.restore()
  t.end()
})

test('When checking whether an invalid instance has an error', t => {
  const getServiceSchemaStub = stub(validateRequired, 'getServiceSchema')
  getServiceSchemaStub.callsFake(() => {
    return {
      properties: {
        name: {
          processInput: true
        },
        value: {
          default: 'default-val'
        }
      }
    }
  })
  const nameInstance = {
    _id: 'a',
    _type: 'text',
    name: 'test-a'
  }
  const userData = getUserData({})
  const validatedInstanceErrors = validateInstanceRequired(nameInstance, userData)

  t.equal(validatedInstanceErrors.length, 1, 'it should return the expected number of errors')
  t.equal(validatedInstanceErrors[0].errorType, 'required', 'it should return an error of the expected type')

  const skipValidationInstance = Object.assign({ $skipValidation: true }, nameInstance)
  const skipValidationErrors = validateInstanceRequired(skipValidationInstance, userData)
  t.equal(skipValidationErrors.length, 0, 'it should return no errors if $skipValidation property sett')

  getServiceSchemaStub.restore()
  t.end()
})

test('When checking whether a valid instance has an error', t => {
  const getServiceSchemaStub = stub(validateRequired, 'getServiceSchema')
  getServiceSchemaStub.callsFake(() => {
    return {
      properties: {
        value: {
          default: 'default-checkbox-val'
        }
      }
    }
  })
  const nameInstance = {
    _id: 'a',
    _type: 'text',
    name: 'test-a'
  }
  const userData = getUserData({})
  const validatedInstance = validateInstanceRequired(nameInstance, userData)

  const expected = []

  t.deepEqual(validatedInstance, expected, 'it should return an empty array')
  getServiceSchemaStub.restore()
  t.end()
})

test('When checking whether an instance is required', t => {
  const userData = getUserData({})
  const defaultInstance = {
    _id: 'a',
    _type: 'text',
    name: 'test-a'
  }
  const defaultRequired = isRequired(defaultInstance, userData)
  t.equal(defaultRequired, true, 'it should return true when required is not explicitly set')

  const requiredInstance = {
    _id: 'a',
    _type: 'text',
    name: 'test-a',
    validation: {
      required: true
    }
  }
  const required = isRequired(requiredInstance, userData)
  t.equal(required, true, 'it should return true when required is explicitly set to true')

  const optionalInstance = {
    _id: 'a',
    _type: 'text',
    name: 'test-a',
    validation: {
      required: false
    }
  }
  const optionalRequired = isRequired(optionalInstance, userData)
  t.equal(optionalRequired, false, 'it should return false when required is explicitly set to false')

  const checkboxInstance = {
    _id: 'a',
    _type: 'checkbox',
    name: 'test-a'
  }
  const checkboxRequired = isRequired(checkboxInstance, userData)
  t.equal(checkboxRequired, false, 'it should always return false for checkboxes')

  const buttonInstance = {
    _id: 'a',
    _type: 'button',
    name: 'test-a'
  }
  const buttonRequired = isRequired(buttonInstance, userData)
  t.deepEqual(buttonRequired, false, 'it should always return false for buttons')

  t.end()
})

test('When checking whether an instance that has a conditional required property is required', t => {
  const userData = getUserData({ foo: 'bar' })
  const conditionalRequiredInstance = {
    _id: 'a',
    _type: 'text',
    name: 'test-a',
    validation: {
      required: {
        identifier: 'foo',
        operator: 'is',
        value: 'bar'
      }
    }
  }
  const conditionalRequired = isRequired(conditionalRequiredInstance, userData)
  t.equal(conditionalRequired, true, 'it should return true when required property evaluates to true')

  const conditionalNotRequiredInstance = {
    _id: 'a',
    _type: 'text',
    name: 'test-a',
    validation: {
      required: {
        identifier: 'foo',
        operator: 'is',
        value: 'bar',
        negated: true
      }
    }
  }
  const conditionalNotRequired = isRequired(conditionalNotRequiredInstance, userData)
  t.equal(conditionalNotRequired, false, 'it should return false when required property evaluates to false')

  t.end()
})

test('When checking whether an instance that has a conditional required property is required', t => {
  const userData = getUserData({ foo: 'bar' })
  const conditionalMetInstance = {
    _id: 'a',
    _type: 'text',
    name: 'test-a',
    $conditionalShow: {
      identifier: 'foo',
      operator: 'is',
      value: 'bar'
    }
  }
  const conditionalMetRequired = isRequired(conditionalMetInstance, userData)
  t.equal(conditionalMetRequired, true, 'it should return true for conditional components whose condition is met')

  const conditionalNotMetInstance = {
    _id: 'a',
    _type: 'text',
    name: 'test-a',
    $conditionalShow: {
      identifier: 'foo',
      operator: 'is',
      value: 'bar',
      negated: true
    }
  }
  const conditionalNotMetRequired = isRequired(conditionalNotMetInstance, userData)
  t.equal(conditionalNotMetRequired, false, 'it should return false for conditional components whose condition is not met')

  t.end()
})

test('When checking whether a composite instance has an error', t => {
  getComponentCompositeStub.returns(['x', 'y'])
  const getServiceSchemaStub = stub(validateRequired, 'getServiceSchema')
  getServiceSchemaStub.callsFake(() => {
    return {
      properties: {
        name: {
          processInput: true
        },
        value: {}
      }
    }
  })
  const nameInstance = {
    _id: 'a',
    _type: 'text',
    name: 'test-a'
  }

  const allAnsweredUserData = getUserData({
    'test-a-x': 'a',
    'test-a-y': 'b'
  })
  const allAnsweredErrors = validateInstanceRequired(nameInstance, allAnsweredUserData)
  t.equal(allAnsweredErrors.length, 0, 'it should return no errors if all fields have been answered')

  const halfAnsweredUserData = getUserData({
    'test-a-x': 'a'
  })
  const halfAnsweredErrors = validateInstanceRequired(nameInstance, halfAnsweredUserData)
  t.equal(halfAnsweredErrors.length, 0, 'it should return no errors if at least one field gas been answered')

  const userData = getUserData({})
  const validatedInstanceErrors = validateInstanceRequired(nameInstance, userData)
  t.equal(validatedInstanceErrors.length, 1, 'it should return the expected number of errors if no fields have been answered')
  t.equal(validatedInstanceErrors[0].errorType, 'required', 'it should return an error of the expected type, required')

  const emptyUserData = getUserData({
    'test-a-x': '',
    'test-a-y': ' '
  })
  const emptyErrors = validateInstanceRequired(nameInstance, emptyUserData)
  t.equal(emptyErrors.length, 1, 'it should return the expected number of errors if fields are empty')

  getServiceSchemaStub.restore()
  getComponentCompositeStub.reset()
  t.end()
})

test('When checking whether a composite instance with a controller has an error', t => {
  getComponentCompositeStub.returns(['x', 'y'])
  const getServiceSchemaStub = stub(validateRequired, 'getServiceSchema')
  getServiceSchemaStub.callsFake(() => {
    return {
      properties: {
        name: {
          processInput: true
        },
        value: {}
      }
    }
  })
  const nameInstance = {
    _id: 'a',
    _type: 'text',
    name: 'test-a'
  }

  const allAnsweredUserData = getUserData({
    'test-a-x': 'a',
    'test-a-y': 'b'
  })
  const allAnsweredErrors = validateInstanceRequired(nameInstance, allAnsweredUserData)
  t.equal(allAnsweredErrors.length, 0, 'it should return no errors if all fields have been answered')

  const userData = getUserData({})
  const validatedInstanceErrors = validateInstanceRequired(nameInstance, userData)
  t.equal(validatedInstanceErrors.length, 1, 'it should return the expected number of errors if no fields have been answered')
  t.equal(validatedInstanceErrors[0].errorType, 'required', 'it should return an error of the expected type, required')

  getServiceSchemaStub.restore()
  getComponentCompositeStub.reset()
  t.end()
})
