require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const sinon = require('sinon')

const serviceData = require('~/fb-runner-node/service-data/service-data')

const {
  setErrors,
  setControlError,
  setControlErrors,
  setSummaryError,
  setSummaryErrors,
  setSummaryErrorsHeading,
  getFormattedError,
  adjustErrorObjs,
  getLabelForLang,
  getLegendForLang,
  getFormatParameters,
  getInstanceErrorStringsFromControl,
  hasInstanceErrorString,
  getInstanceErrorString,
  normaliseErrorString,
  getErrorLookupsArray
} = require('./set-errors')

test('The module', t => {
  t.equal(typeof setErrors, 'function', 'exports the `setErrors` function')
  t.equal(typeof setControlError, 'function', 'exports the `setControlError` function')
  t.equal(typeof setControlErrors, 'function', 'exports the `setControlErrors` function')
  t.equal(typeof setSummaryError, 'function', 'exports the `setSummaryError` function')
  t.equal(typeof setSummaryErrors, 'function', 'exports the `setSummaryErrors` function')
  t.equal(typeof setSummaryErrorsHeading, 'function', 'exports the `setSummaryErrorsHeading` function')
  t.equal(typeof getFormattedError, 'function', 'exports the `getFormattedError` function')
  t.equal(typeof adjustErrorObjs, 'function', 'exports the `getFormattedError` function')
  t.equal(typeof getFormatParameters, 'function', 'exports the `getFormatParameters` function')
  t.equal(typeof getLabelForLang, 'function', 'exports the `getLabelForLang` function')
  t.equal(typeof getLegendForLang, 'function', 'exports the `getLegendForLang` function')
  t.equal(typeof getInstanceErrorStringsFromControl, 'function', 'exports the `getInstanceErrorStringsFromControl` function')
  t.equal(typeof hasInstanceErrorString, 'function', 'exports the `hasInstanceErrorString` function')
  t.equal(typeof getInstanceErrorString, 'function', 'exports the `getInstanceErrorString` function')
  t.equal(typeof normaliseErrorString, 'function', 'exports the `normaliseErrorString` function')
  t.equal(typeof getErrorLookupsArray, 'function', 'exports the `getErrorLookupsArray` function')
  t.end()
})

test('When adjusting error objects', t => {
  t.deepEqual(adjustErrorObjs({}), undefined, 'returns undefined if errors are undefined')

  {
    const errors = [{instance: {name: 'test'}, errorType: 'boom'}]

    t.deepEqual(adjustErrorObjs({}, errors), errors, 'returns errors if errors are defined')
  }

  {
    const pageInstance = {}

    const errors = [{instance: 'test', errorType: 'boom'}]
    const adjusted = [{instance: {}, errorType: 'boom'}]

    t.deepEqual(adjustErrorObjs(pageInstance, errors), adjusted, 'removes errors which cannot be mapped to a component in the page instance')
  }

  {
    const pageInstance = {
      components: [{
        name: 'test'
      }]
    }
    const errors = [{instance: 'test', errorType: 'boom'}]
    const adjusted = [{
      instance: {
        name: 'test'
      },
      errorType: 'boom'
    }]
    t.deepEqual(adjustErrorObjs(pageInstance, errors), adjusted, 'adjusts errors which can be mapped to a component in the page instance')
  }

  t.end()
})

test('When formatting error messages', t => {
  const errorType = 'boom'
  const controlInstance = {
    _type: 'text',
    label: 'Your name'
  }

  t.equal(getFormattedError('azimuth', controlInstance, errorType), 'boom', 'uses the `errorType` as the default value')

  /**
   *  TODO: Mock `serviceData.setServiceInstances()`
   */
  serviceData.setServiceInstances({
    'error.boom.azimuth': {value: 'It went boom', 'value:dry': 'Ich wa kerplunkt'}
  })

  t.equal(getFormattedError('azimuth', controlInstance, errorType), 'It went boom', 'uses the default error message for the `errorType`')

  t.equal(getFormattedError('azimuth', controlInstance, errorType, null, 'dry'), 'Ich wa kerplunkt', 'uses the localised default error message for the `errorType` when `lang` is present`')

  /**
   *  TODO: Mock `serviceData.setServiceInstances()`
   */
  serviceData.setServiceInstances({
    'error.boom.azimuth': {
      value: 'It went boom'
    },
    'error.boom.text.azimuth': {
      value: 'Text went boom'
    }
  })

  t.equal(getFormattedError('azimuth', controlInstance, errorType), 'Text went boom', 'uses the component error message for the `errorType`')

  controlInstance.errors = {
    boom: {
      azimuth: 'Total text explosion'
    }
  }

  t.equal(getFormattedError('azimuth', controlInstance, errorType), 'Total text explosion', 'uses the explicit message set by the control')

  controlInstance.errors = {
    boom: {
      azimuth: '‘{control}’ exploded'
    }
  }

  t.equal(getFormattedError('azimuth', controlInstance, errorType), '‘Your name’ exploded', 'uses the explicit message set by the control containing the control label')

  {
    controlInstance.errors = {
      boom: {
        azimuth: ''
      }
    }
    const formattedError = getFormattedError('azimuth', controlInstance, errorType)

    t.equal(formattedError, '', 'uses the explicit message set by the control when it is an empty string')
  }

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
        azimuth: '{value} is less than {minimum}',
        'azimuth:dry': '{value} ich minsky kao {minimum}'
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

  t.equal(getFormattedError('azimuth', controlInstance, 'minimum', {instance: 1}), '1 is less than 5', 'uses the `minimum` error string')

  t.equal(getFormattedError('azimuth', controlInstance, 'minimum', {instance: 1}, 'dry'), '1 ich minsky kao 5', 'uses the localised `minimum` error string')

  t.equal(getFormattedError('azimuth', controlInstance, 'maximum', {instance: 15}), '15 is greater than 10', 'uses the `maximum` error string')

  controlInstance.validation.exclusiveMinimum = true
  controlInstance.validation.exclusiveMaximum = true

  t.equal(getFormattedError('azimuth', controlInstance, 'minimum', {instance: 1}), '1 is less than or equal to 5', 'uses the `exclusiveMinimum` error string')

  t.equal(getFormattedError('azimuth', controlInstance, 'maximum', {instance: 15}), '15 is greater than or equal to 10', 'uses the `exclusiveMaximum` error string')

  t.equal(getFormattedError('azimuth', controlInstance, 'type', {name: 'type', schema: {type: 'madeupType'}}), 'type is not madeupType', 'uses the `type` error string')

  t.end()
})

test('When preparing parameters for formatting', t => {
  {
    /**
     *  Label
     */
    const controlInstance = {
      _type: 'MOCK CONTROL TYPE',
      label: 'MOCK CONTROL LABEL',
      validation: {
        mockRule: 'MOCK CONTROL VALIDATION RULE VALUE'
      }
    }

    const error = {
      name: 'MOCK ERROR TYPE',
      instance: {},
      message: 'MOCK ERROR MESSAGE',
      targetValue: 'MOCK ERROR TARGET VALUE',
      schema: {
        type: 'MOCK ERROR SCHEMA TYPE'
      }
    }

    t.deepEqual(getFormatParameters(controlInstance, error), {
      control: 'MOCK CONTROL LABEL',
      mockRule: 'MOCK CONTROL VALIDATION RULE VALUE',
      value: {},
      targetValue: 'MOCK ERROR TARGET VALUE',
      errorName: 'MOCK ERROR TYPE',
      errorMessage: 'MOCK ERROR MESSAGE'
    }, 'merges fields and assigns the default `label` value to `control`')
  }

  {
    /**
     *  Label
     */
    const controlInstance = {
      _type: 'MOCK CONTROL TYPE',
      label: 'MOCK CONTROL LABEL',
      'label:mock-lang': 'MOCK LANG CONTROL LABEL',
      validation: {
        mockRule: 'MOCK CONTROL VALIDATION RULE VALUE'
      }
    }

    const error = {
      name: 'MOCK ERROR TYPE',
      instance: {},
      message: 'MOCK ERROR MESSAGE',
      targetValue: 'MOCK ERROR TARGET VALUE',
      schema: {
        type: 'MOCK ERROR SCHEMA TYPE'
      }
    }

    t.deepEqual(getFormatParameters(controlInstance, error, 'mock-lang'), {
      control: 'MOCK LANG CONTROL LABEL',
      mockRule: 'MOCK CONTROL VALIDATION RULE VALUE',
      value: {},
      targetValue: 'MOCK ERROR TARGET VALUE',
      errorName: 'MOCK ERROR TYPE',
      errorMessage: 'MOCK ERROR MESSAGE'
    }, 'merges fields and assigns the localised `label` value to `control`')
  }

  {
    /**
     *  Legend
     */
    const controlInstance = {
      _type: 'MOCK CONTROL TYPE',
      legend: 'MOCK CONTROL LEGEND',
      validation: {
        mockRule: 'MOCK CONTROL VALIDATION RULE VALUE'
      }
    }

    const error = {
      name: 'MOCK ERROR TYPE',
      instance: {},
      message: 'MOCK ERROR MESSAGE',
      targetValue: 'MOCK ERROR TARGET VALUE',
      schema: {
        type: 'MOCK ERROR SCHEMA TYPE'
      }
    }

    t.deepEqual(getFormatParameters(controlInstance, error), {
      control: 'MOCK CONTROL LEGEND',
      mockRule: 'MOCK CONTROL VALIDATION RULE VALUE',
      value: {},
      targetValue: 'MOCK ERROR TARGET VALUE',
      errorName: 'MOCK ERROR TYPE',
      errorMessage: 'MOCK ERROR MESSAGE'
    }, 'merges fields and assigns the default `legend` value to `control`')
  }

  {
    /**
     *  Legend
     */
    const controlInstance = {
      _type: 'MOCK CONTROL TYPE',
      'legend:mock-lang': 'MOCK LANG CONTROL LEGEND',
      validation: {
        mockRule: 'MOCK CONTROL VALIDATION RULE VALUE'
      }
    }

    const error = {
      name: 'MOCK ERROR TYPE',
      instance: {},
      message: 'MOCK ERROR MESSAGE',
      targetValue: 'MOCK ERROR TARGET VALUE',
      schema: {
        type: 'MOCK ERROR SCHEMA TYPE'
      }
    }

    t.deepEqual(getFormatParameters(controlInstance, error, 'mock-lang'), {
      control: 'MOCK LANG CONTROL LEGEND',
      mockRule: 'MOCK CONTROL VALIDATION RULE VALUE',
      value: {},
      targetValue: 'MOCK ERROR TARGET VALUE',
      errorName: 'MOCK ERROR TYPE',
      errorMessage: 'MOCK ERROR MESSAGE'
    }, 'merges fields and assigns the localised `legend` value to `control`')
  }

  {
    const controlInstance = {
      _type: 'MOCK CONTROL TYPE',
      label: 'MOCK CONTROL LABEL',
      validation: {
        mockRule: 'MOCK CONTROL VALIDATION RULE VALUE'
      }
    }

    const error = {
      name: 'type',
      instance: {},
      message: 'MOCK ERROR MESSAGE',
      targetValue: 'MOCK ERROR TARGET VALUE',
      schema: {
        type: 'MOCK ERROR SCHEMA TYPE'
      }
    }

    t.deepEqual(getFormatParameters(controlInstance, error), {
      control: 'MOCK CONTROL LABEL',
      mockRule: 'MOCK CONTROL VALIDATION RULE VALUE',
      value: {},
      targetValue: 'MOCK ERROR TARGET VALUE',
      errorName: 'type', // <-
      errorMessage: 'MOCK ERROR MESSAGE',
      errorType: 'MOCK ERROR SCHEMA TYPE' // <-
    }, 'merges fields and assigns the `schema.type` value to the `error.type` field if the `error.name` value is \'type\'')
  }

  t.end()
})

test('When getting the label', t => {
  t.equal(getLabelForLang({label: 'MOCK LABEL'}), 'MOCK LABEL', 'returns the default label')
  t.end()
})

test('When getting the localised label', t => {
  t.equal(getLabelForLang({'label:mock-lang': 'MOCK LANG LABEL'}, 'mock-lang'), 'MOCK LANG LABEL', 'returns the localised label')
  t.end()
})

test('When getting the legend', t => {
  t.equal(getLegendForLang({legend: 'MOCK LEGEND'}), 'MOCK LEGEND', 'returns the default legend')
  t.end()
})

test('When getting the localised legend', t => {
  t.equal(getLegendForLang({'legend:mock-lang': 'MOCK LANG LEGEND'}, 'mock-lang'), 'MOCK LANG LEGEND', 'returns the localised legend')
  t.end()
})

test('When getting the error strings from the control', t => {
  const mockErrors = {}

  t.deepEqual(getInstanceErrorStringsFromControl(), {}, 'always returns an object')
  t.equal(getInstanceErrorStringsFromControl({errors: {mockErrors}}, 'mockErrors'), mockErrors, 'returns the error object for the error type')

  t.end()
})

test('When getting the error lookups array', t => {
  t.deepEqual(getErrorLookupsArray('MOCK ERROR TYPE', 'MOCK CONTROL TYPE', 'MOCK POSITION'), [
    'error.MOCK ERROR TYPE.MOCK CONTROL TYPE.MOCK POSITION',
    'error.MOCK CONTROL TYPE.MOCK ERROR TYPE.MOCK POSITION',
    'error.MOCK ERROR TYPE.MOCK CONTROL TYPE',
    'error.MOCK CONTROL TYPE.MOCK ERROR TYPE',
    'error.MOCK ERROR TYPE.MOCK POSITION',
    'error.MOCK ERROR TYPE'
  ], 'returns an array of strings')
  t.end()
})

test('When normalising the error', t => {
  const controlInstance = {}
  const error = {}

  /**
   *  These are typical/expected values, not exotic ones (such as dates, objects, regular expressions, or functions)
   */
  t.equal(normaliseErrorString(null, controlInstance, error), 'null', 'converts `null` to a string')
  t.equal(normaliseErrorString(true, controlInstance, error), 'true', 'converts `true` to a string')
  t.equal(normaliseErrorString(false, controlInstance, error), 'false', 'converts `false` to a string')
  t.equal(normaliseErrorString(undefined, controlInstance, error), 'undefined', 'converts `undefined` to a string')
  t.equal(normaliseErrorString(1, controlInstance, error), '1', 'converts numbers to a string')
  t.equal(normaliseErrorString('MOCK ERROR', controlInstance, error), 'MOCK ERROR', 'returns a string')
  t.equal(normaliseErrorString('<p>MOCK ERROR</p>', controlInstance, error), '&lt;p&gt;MOCK ERROR&lt;/p&gt;', 'returns a string with escaped mark-up')

  t.end()
})

test('When testing the error strings for a field', t => {
  const errorStrings = {}
  const position = 'MOCK POSITION'
  const lang = 'MOCK LANG'

  {
    const spy = sinon.spy(Reflect, 'has')

    hasInstanceErrorString(errorStrings, position)

    t.equal(spy.callCount, 1, 'calls `Reflect.has()` once')
    t.deepEqual(spy.getCall(0).args, [errorStrings, 'MOCK POSITION'], 'calls `Reflect.has()` with the error string object and position string')

    spy.restore()
  }

  {
    const stub = sinon.stub(Reflect, 'has')

    stub.returns(true)

    hasInstanceErrorString(errorStrings, position, lang)

    t.equal(stub.callCount, 1, 'calls `Reflect.has()` once')
    t.deepEqual(stub.getCall(0).args, [errorStrings, 'MOCK POSITION:MOCK LANG'], 'calls `Reflect.has()` with the error string object and concatenated position and lang strings')

    stub.restore()
  }

  {
    const stub = sinon.stub(Reflect, 'has')

    stub.returns(false)

    hasInstanceErrorString(errorStrings, position, lang)

    t.equal(stub.callCount, 2, 'calls `Reflect.has()` twice')
    t.deepEqual(stub.getCall(0).args, [errorStrings, 'MOCK POSITION:MOCK LANG'], 'calls `Reflect.has()` with the error string object and concatenated position and lang strings')
    t.deepEqual(stub.getCall(1).args, [errorStrings, 'MOCK POSITION'], 'calls `Reflect.has()` with the error string object and position string')

    stub.restore()
  }

  t.end()
})

test('When getting the error strings for a field', t => {
  const errorStrings = {}
  const position = 'MOCK POSITION'
  const lang = 'MOCK LANG'

  {
    const spy = sinon.spy(Reflect, 'get')

    getInstanceErrorString(errorStrings, position)

    t.equal(spy.callCount, 1, 'calls `Reflect.get()` once')
    t.deepEqual(spy.getCall(0).args, [errorStrings, 'MOCK POSITION'], 'calls `Reflect.get()` with the error string object and position string')

    spy.restore()
  }

  {
    const stub = sinon.stub(Reflect, 'get')

    stub.returns(true)

    getInstanceErrorString(errorStrings, position, lang)

    t.equal(stub.callCount, 1, 'calls `Reflect.get()` once')
    t.deepEqual(stub.getCall(0).args, [errorStrings, 'MOCK POSITION:MOCK LANG'], 'calls `Reflect.get()` with the error string object and concatenated position and lang strings')

    stub.restore()
  }

  {
    const stub = sinon.stub(Reflect, 'get')

    stub.returns(false)

    getInstanceErrorString(errorStrings, position, lang)

    t.equal(stub.callCount, 2, 'calls `Reflect.get()` twice')
    t.deepEqual(stub.getCall(0).args, [errorStrings, 'MOCK POSITION:MOCK LANG'], 'calls `Reflect.get()` with the error string object and concatenated position and lang strings')
    t.deepEqual(stub.getCall(1).args, [errorStrings, 'MOCK POSITION'], 'calls `Reflect.get()` with the error string object and position string')

    stub.restore()
  }

  t.end()
})

test('When setting a control error', t => {
  const errorType = 'boom'
  const controlInstance = {
    _type: 'text',
    label: 'Your name'
  }
  const {error} = setControlError({}, controlInstance, errorType)
  t.equal(error, 'boom', 'it should set the instance’s error property')
  t.end()
})

test('When setting another control error', t => {
  const errorType = 'boom'
  const controlInstance = {
    _type: 'text',
    label: 'Your name',
    error: 'Initial'
  }
  const {error} = setControlError({}, controlInstance, errorType)
  t.equal(error, 'Initial<br>boom', 'it should append the error to the instance’s error property')
  t.end()
})

test('When setting control errors', t => {
  {
    /**
     * With errors
     */
    const controlA = {
      _id: 'controlA',
      _type: 'text',
      label: 'Your name'
    }

    const controlB = {
      _id: 'controlB',
      _type: 'number',
      label: 'Your age'
    }

    const errors = [
      {
        instance: controlA,
        errorType: 'boom'
      },
      {
        instance: controlB,
        errorType: 'minimum',
        error: {
          instance: 12
        }
      }
    ]

    const pageInstance = {
      components: [
        controlA,
        controlB
      ]
    }

    const {
      components: [
        componentOne,
        componentTwo
      ]
    } = setControlErrors(pageInstance, errors)

    t.deepEqual(componentOne, {_id: 'controlA', _type: 'text', label: 'Your name', error: 'boom'}, 'adds an error to the first component')
    t.deepEqual(componentTwo, {_id: 'controlB', _type: 'number', label: 'Your age', error: 'minimum'}, 'adds an error to the second component')
  }

  {
    /**
     *  Without errors
     */
    const pageInstance = {
      components: [
        {
          _id: 'controlA',
          _type: 'text',
          label: 'Your name'
        },
        {
          _id: 'controlB',
          _type: 'number',
          label: 'Your age'
        }
      ]
    }

    const {
      components: [
        componentOne,
        componentTwo
      ]
    } = setControlErrors(pageInstance)

    t.deepEqual(componentOne, {_id: 'controlA', _type: 'text', label: 'Your name'}, 'does not add an error')
    t.deepEqual(componentTwo, {_id: 'controlB', _type: 'number', label: 'Your age'}, 'does not add an error')
  }

  t.end()
})

test('When setting a summary error', t => {
  const controlInstance = {
    _id: 'control',
    _type: 'text',
    name: 'controlname',
    label: 'Your name'
  }
  const pageInstance = {
    _type: 'page.form',
    components: [
      controlInstance
    ]
  }
  const errorType = 'boom'

  setSummaryError(pageInstance, controlInstance, errorType)

  t.deepEqual(pageInstance.errorList, [{
    html: 'boom',
    href: '#control'
  }], 'it should add the error to the page instance’s error list')

  t.end()
})

test('When setting a summary error for a composite field', t => {
  const controlInstance = {
    _id: 'control',
    _type: 'text',
    name: 'controlname',
    label: 'Your name'
  }
  const pageInstance = {
    _type: 'page.form',
    components: [
      controlInstance
    ]
  }
  const errorType = 'boom'

  setSummaryError(pageInstance, controlInstance, errorType, {compositeInput: 'rose'})

  t.deepEqual(pageInstance.errorList, [{
    html: 'boom',
    href: '#controlname-rose'
  }], 'it should add the anchor for the correct composite input field')
  t.end()
})

test('When setting a summary error for a radios field ', t => {
  const controlInstance = {
    _id: 'control',
    _type: 'radios',
    name: 'controlname',
    label: 'Your name',
    items: []
  }
  const pageInstance = {
    _type: 'page.form',
    components: [
      controlInstance
    ]
  }
  const errorType = 'boom'

  setSummaryError(pageInstance, controlInstance, errorType)

  t.deepEqual(pageInstance.errorList, [{
    html: 'boom',
    href: '#controlname-0'
  }], 'it should add the anchor for the first radio option element based on the radios instance name')
  t.end()
})

test('When setting a summary error for a field with items with no name', t => {
  const controlInstance = {
    _id: 'control',
    _type: 'checkboxes',
    name: 'controlname',
    label: 'Your name',
    items: [{
      name: 'checkbox-name'
    }]
  }
  const pageInstance = {
    _type: 'page.form',
    components: [
      controlInstance
    ]
  }
  const errorType = 'boom'

  setSummaryError(pageInstance, controlInstance, errorType)

  t.deepEqual(pageInstance.errorList, [{
    html: 'boom',
    href: '#checkbox-name'
  }], 'it should add the anchor for the first checkbox option element')
  t.end()
})

test('When adding a delimited summary error', t => {
  const xInst = {}
  setSummaryError(xInst, 'fakeinstance', 'boom==/url')
  t.deepEqual(xInst.errorList, [{
    html: 'boom',
    href: '/url'
  }], 'it should split the parts into html and text params')

  t.end()
})

test('When setting summary errors', t => {
  {
    /**
     *  With errors
     */
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

    /**
     *  TODO: Mock `serviceData.setServiceInstances()`
     */
    serviceData.setServiceInstances({
      'errors.summary.heading': {
        value: 'Something went wrong'
      }
    })

    const returnValue = setSummaryErrors(pageInstance, errors)

    t.equal(returnValue, pageInstance, 'returns the page instance')
    t.deepEqual(returnValue, {
      errorsSeen: {
        summary: {
          control1: 'boom',
          control2: 'minimum'
        },
        control: {}
      },
      errorList: [
        {html: 'boom', href: '#control1'},
        {html: 'minimum', href: '#control2'}
      ],
      errorTitle: 'Something went wrong'
    },
    'mutates the page instance by adding an `errorsSeen` field, an `errorList` field, and an `errorTitle` field')
  }

  {
    /**
     *  Without errors
     */
    const pageInstance = {}
    const errors = []

    /**
     *  TODO: Mock `serviceData.setServiceInstances()`
     */
    serviceData.setServiceInstances({
      'errors.summary.heading': {
        value: 'Something went wrong'
      }
    })

    const returnValue = setSummaryErrors(pageInstance, errors)

    t.equal(returnValue, pageInstance, 'returns the page instance')
    t.deepEqual(returnValue, {}, 'does not mutate the page instance by adding an `errorsSeen` field, an `errorList` field, and an `errorTitle` field')
  }

  t.end()
})

test('When setting duplicate summary errors', t => {
  let pageInstance = {}
  const errorsA = [{
    instance: {
      _id: 'control1',
      _type: 'text',
      label: 'Your name'
    },
    errorType: 'required'
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

  const errorsB = [{
    instance: {
      _id: 'control1',
      _type: 'text',
      label: 'Your name'
    },
    errorType: 'another'
  }, {
    instance: {
      _id: 'control2',
      _type: 'number',
      label: 'Your age'
    },
    errorType: 'required'
  }]

  /**
   *  TODO: Mock `serviceData.setServiceInstances()`
   */
  serviceData.setServiceInstances({
    'errors.summary.heading': {
      value: 'Something went wrong'
    }
  })

  pageInstance = setErrors(pageInstance, errorsA)
  pageInstance = setErrors(pageInstance, errorsB)

  const [
    errorOne,
    errorTwo
  ] = pageInstance.errorList

  t.deepEqual(errorOne, {
    html: 'required', href: '#control1'
  }, 'it should not add other errors if a required error has already been registered for the component')

  t.deepEqual(errorTwo, {
    html: 'minimum', href: '#control2'
  }, 'it should not add required errors if any error has already been registered for the component')

  t.end()
})

test('When errors have been registered out of source order', t => {
  const control1 = {
    _id: 'control1'
  }
  const control2 = {
    _id: 'control2'
  }

  let pageInstance = {
    components: [
      control1,
      control2
    ]
  }
  const errors = [{
    instance: control2,
    errorType: 'required'
  }, {
    instance: control1,
    errorType: 'invalid'
  }]

  pageInstance = setErrors(pageInstance, errors)
  const errorList = pageInstance.errorList

  t.deepEqual(errorList, [{
    html: 'invalid', href: '#control1'
  }, {
    html: 'required', href: '#control2'
  }], 'it should reorder the summary error list per source order')

  t.end()
})

test('When setting summary heading', t => {
  /**
   *  TODO: Mock `serviceData.setServiceInstances()`
   */
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

test('When setting errors', t => {
  const pageInstance = {}

  const returnValue = setErrors(pageInstance)

  t.equal(returnValue, pageInstance, 'returns the page instance')
  t.deepEqual(returnValue, {errorsSeen: {summary: {}, control: {}}}, 'mutates the page instance by adding an `errorsSeen` field')

  t.end()
})
