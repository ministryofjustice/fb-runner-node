const test = require('tape')
const {spy, stub} = require('sinon')
const serviceData = require('../../service-data/service-data')

const {deepClone} = require('@ministryofjustice/fb-utils-node')

const setErrorsModule = require('./set-errors')
const {
  setErrors,
  setControlError,
  setControlErrors,
  setSummaryError,
  setSummaryErrors,
  setSummaryErrorsHeading,
  getFormattedError,
  adjustErrorObjs
} = setErrorsModule

test('When setErrors is required ', t => {
  t.equal(typeof setErrors, 'function', 'it should export setErrors method')
  t.equal(typeof setControlError, 'function', 'it should export setControlError method')
  t.equal(typeof setControlErrors, 'function', 'it should export setControlErrors method')
  t.equal(typeof setSummaryError, 'function', 'it should export setSummaryError method')
  t.equal(typeof setSummaryErrors, 'function', 'it should export setSummaryErrors method')
  t.equal(typeof setSummaryErrorsHeading, 'function', 'it should export setSummaryErrorsHeading method')
  t.equal(typeof getFormattedError, 'function', 'it should export getFormattedError method')
  t.end()
})

test('When adjusting error objects', t => {
  const undefinedErrors = undefined
  t.deepEqual(adjustErrorObjs({}, undefinedErrors), undefined, 'it should return undefined if passed no error objects')

  const instanceArg = [{instance: {name: 'test'}, errorType: 'boom'}]
  t.deepEqual(adjustErrorObjs({}, instanceArg), instanceArg, 'it should leave error objects with instances as they are')

  const stringInstanceArg = [{instance: 'test', errorType: 'boom'}]

  const expectedNoInstanceArg = [{instance: {}, errorType: 'boom'}]
  t.deepEqual(adjustErrorObjs({}, deepClone(stringInstanceArg)), expectedNoInstanceArg, 'it should remove instances from error objects that cannot be found in page instance')

  const page = {
    components: [{
      name: 'test'
    }]
  }
  const expectedInstanceArg = [{instance: {
    name: 'test'
  },
  errorType: 'boom'}]
  t.deepEqual(adjustErrorObjs(page, deepClone(stringInstanceArg)), expectedInstanceArg, 'it should replace strings with instances in error objects that can be found in page instance')
  t.end()
})

test('When formatting error messages', t => {
  const errorType = 'boom'
  const controlInstance = {
    _type: 'text',
    label: 'Your name'
  }
  const error = null

  const fallbackErrorString = getFormattedError('azimuth', controlInstance, errorType, error)
  t.equal(fallbackErrorString, 'boom', 'it should use the errorType as the fallback value if no other error strings found')

  serviceData.setServiceInstances({
    'error.boom.azimuth': {value: 'It went boom'}
  })

  const defaultErrorString = getFormattedError('azimuth', controlInstance, errorType, error)
  t.equal(defaultErrorString, 'It went boom', 'it should use the default error message for the errorType')

  serviceData.setServiceInstances({
    'error.boom.azimuth': {
      value: 'It went boom'
    },
    'error.boom.text.azimuth': {
      value: 'Text went boom'
    }
  })

  const defaultControlErrorString = getFormattedError('azimuth', controlInstance, errorType, error)
  t.equal(defaultControlErrorString, 'Text went boom', 'it should use the component variant error message for the errorType')

  controlInstance.errors = {
    boom: {
      azimuth: 'Total text explosion'
    }
  }
  const controlErrorString = getFormattedError('azimuth', controlInstance, errorType, error)
  t.equal(controlErrorString, 'Total text explosion', 'it should use any explicit message set by the instance')

  controlInstance.errors = {
    boom: {
      azimuth: '‘{control}’ exploded'
    }
  }
  const substitutedControlErrorString = getFormattedError('azimuth', controlInstance, errorType, error)
  t.equal(substitutedControlErrorString, '‘Your name’ exploded', 'it should substitute the control’s label when requested')

  controlInstance.errors = {
    boom: {
      azimuth: ''
    }
  }
  const emptyControlErrorString = getFormattedError('azimuth', controlInstance, errorType, error)
  t.equal(emptyControlErrorString, '', 'it should return an empty string rather than trying to find the next possible value')

  t.end()
})

test('When formatting minimum and maximum messages', t => {
  const controlInstance = {
    _type: 'number',
    label: 'Days requested',
    validation: {
      minimum: 5,
      maximum: 10
    },
    errors: {
      minimum: {
        azimuth: '{value} is less than {minimum}'
      },
      exclusiveMinimum: {
        azimuth: '{value} is less than or equal to {minimum}'
      },
      maximum: {
        azimuth: '{value} is greater than {maximum}'
      },
      exclusiveMaximum: {
        azimuth: '{value} is greater than or equal to {maximum}'
      },
      type: {
        azimuth: '{errorName} is not {errorType}'
      }
    }
  }

  const minimumErrorString = getFormattedError('azimuth', controlInstance, 'minimum', {instance: 1})
  t.equal(minimumErrorString, '1 is less than 5', 'it should use the minimum error string')

  const maximumErrorString = getFormattedError('azimuth', controlInstance, 'maximum', {instance: 15})
  t.equal(maximumErrorString, '15 is greater than 10', 'it should use the maximum error string')

  controlInstance.validation.exclusiveMinimum = true
  controlInstance.validation.exclusiveMaximum = true

  const exclusiveMinimumErrorString = getFormattedError('azimuth', controlInstance, 'minimum', {instance: 1})
  t.equal(exclusiveMinimumErrorString, '1 is less than or equal to 5', 'it should use the exclusiveMinimum error string')

  const exclusiveMaximumErrorString = getFormattedError('azimuth', controlInstance, 'maximum', {instance: 15})
  t.equal(exclusiveMaximumErrorString, '15 is greater than or equal to 10', 'it should use the exclusiveMaximum error string')

  const typeErrorString = getFormattedError('azimuth', controlInstance, 'type', {name: 'type', schema: {type: 'madeupType'}})
  t.equal(typeErrorString, 'type is not madeupType', 'it should use the type error string')

  t.end()
})

test('When setting a control error', t => {
  const errorType = 'boom'
  const controlInstance = {
    _type: 'text',
    label: 'Your name'
  }
  const errorInstance = setControlError({}, controlInstance, errorType)
  t.equal(errorInstance.error, 'boom', 'it should set the instance’s error property')
  t.end()
})

test('When setting control errors', t => {
  const errors = [{
    instance: {
      _type: 'text',
      label: 'Your name'
    },
    errorType: 'boom'
  }, {
    instance: {
      _type: 'number',
      label: 'Your age'
    },
    errorType: 'minimum',
    error: {
      instance: 12
    }
  }]

  const setControlErrorSpy = spy(setErrorsModule, 'setControlError')
  const fakePageInstance = {}
  setControlErrors(fakePageInstance, errors)

  t.equal(setControlErrorSpy.callCount, 2, 'it should set the correct number of errors')
  const argsCheck = setControlErrorSpy.getCall(0).calledWith(fakePageInstance, errors[0].instance, errors[0].errorType, undefined) && setControlErrorSpy.getCall(1).calledWith(fakePageInstance, errors[1].instance, errors[1].errorType, errors[1].error)
  t.ok(argsCheck, 'it should set the correct errors')
  setControlErrorSpy.resetHistory()

  const noErrors = []
  setControlErrors(noErrors)
  t.equal(setControlErrorSpy.callCount, 0, 'it should not set any error if there are none')
  setControlErrorSpy.restore()

  t.end()
})

test('When setting a summary error', t => {
  const errorType = 'boom'
  const controlInstance = {
    _id: 'control',
    _type: 'text',
    label: 'Your name'
  }
  const pageInstance = {
    _type: 'page.form',
    components: [
      controlInstance
    ]
  }
  setSummaryError(pageInstance, controlInstance, errorType)
  t.deepEqual(pageInstance.errorList, [{
    html: 'boom',
    href: '#control'
  }], 'it should add the error to the page instance’s error list')

  const xInst = {}
  setSummaryError(xInst, 'fakeinstance', 'boom==/url')
  t.deepEqual(xInst.errorList, [{
    html: 'boom',
    href: '/url'
  }], 'it should add a delimited error, splitting the parts into html and text params')
  t.end()
})

test('When setting summary errors', t => {
  const pageInstance = {}
  const errors = [{
    instance: {
      _id: 'control1',
      _type: 'text',
      label: 'Your name'
    },
    errorType: 'boom'
  }, {
    instance: {
      _id: 'control2',
      _type: 'number',
      label: 'Your age'
    },
    errorType: 'minimum',
    error: {
      instance: 12
    }
  }]

  serviceData.setServiceInstances({
    'errors.summary.heading': {
      value: 'Something went wrong'
    }
  })

  const setSummaryErrorSpy = spy(setErrorsModule, 'setSummaryError')
  const setSummaryErrorsHeadingSpy = spy(setErrorsModule, 'setSummaryErrorsHeading')
  setSummaryErrors(pageInstance, errors)

  t.equal(setSummaryErrorSpy.callCount, 2, 'it should set the correct number of errors')
  const argsCheck = setSummaryErrorSpy.getCall(0).calledWith(pageInstance, errors[0].instance, errors[0].errorType, undefined) && setSummaryErrorSpy.getCall(1).calledWith(pageInstance, errors[1].instance, errors[1].errorType, errors[1].error)
  t.ok(argsCheck, 'it should set the correct errors')
  t.equal(setSummaryErrorsHeadingSpy.callCount, 1, 'it should set the page error heading ')
  t.deepEqual(setSummaryErrorsHeadingSpy.getCall(0).args, [
    {
      errorList: [
        {
          html: 'boom', href: '#control1'
        },
        {
          html: 'minimum', href: '#control2'
        }
      ],
      errorTitle: 'Something went wrong'
    }
  ], 'it should set the page error heading')

  setSummaryErrorSpy.resetHistory()
  setSummaryErrorsHeadingSpy.resetHistory()

  const noErrors = []
  setSummaryErrors(pageInstance, noErrors)
  t.equal(setSummaryErrorSpy.callCount, 0, 'it should not set any error if there are no errors')
  t.equal(setSummaryErrorsHeadingSpy.callCount, 0, 'it should not set the page error heading if there are no errors')
  setSummaryErrorSpy.restore()
  setSummaryErrorsHeadingSpy.restore()

  t.end()
})

test('When setting summary heading', t => {
  serviceData.setServiceInstances({
    'errors.summary.heading': {
      value: 'There {errorCount, plural, 0{were no problems} 1{was one problem} other{were {errorCount} problems}}'
    }
  })

  t.deepEqual(setSummaryErrorsHeading({errorList: [1, 2, 3]}).errorTitle, 'There were 3 problems', 'it should return the correct heading for multiple errors')
  t.deepEqual(setSummaryErrorsHeading({errorList: [1]}).errorTitle, 'There was one problem', 'it should return the correct heading for a single error')

  t.deepEqual(setSummaryErrorsHeading({errorList: []}).errorTitle, 'There were no problems', 'it should return the correct heading for no errors')

  t.end()
})

test('When setting all errors', t => {
  const errorObjs = 'errors'
  const pageInstance = 'pageInstance'

  const setControlErrorsStub = stub(setErrorsModule, 'setControlErrors')
  const setSummaryErrorsStub = stub(setErrorsModule, 'setSummaryErrors')

  setErrors(pageInstance, errorObjs)

  t.ok(setControlErrorsStub.calledOnceWithExactly(pageInstance, errorObjs), 'it should call setControlErrors with the correct args')
  t.ok(setSummaryErrorsStub.calledOnceWithExactly(pageInstance, errorObjs), 'it should call setSummaryErrors with the correct args')

  setControlErrorsStub.reset()
  setSummaryErrorsStub.reset()

  t.end()
})
