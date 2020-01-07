require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

const sinon = require('sinon')

const validateInput = require('~/fb-runner-node/page/validate-input/validate-input')
const isRequiredStub = sinon.stub(validateInput, 'isRequired')

const serviceData = require('~/fb-runner-node/service-data/service-data')
const getServiceSchemaStub = sinon.stub(serviceData, 'getServiceSchema')
getServiceSchemaStub.returns({
  composite: ['day', 'month', 'year'],
  properties: {
    dateType: {
      default: 'day-month-year'
    }
  }
})

const DateController = proxyquire('.', {
  '~/fb-runner-node/page/validate-input/validate-input': validateInput,
  '~/fb-runner-node/service-data/service-data': serviceData
})

const dateComponent = {
  _id: 'foo',
  name: 'dob'
}

const getUserData = (data = {}) => {
  return {
    getUserDataProperty: (prop) => data[prop]
  }
}

test('A date component is not required', t => {
  isRequiredStub.reset()
  isRequiredStub.returns(false)

  const dateController = new DateController()

  const errors = dateController.validate(dateComponent, getUserData())

  t.deepEqual(errors, [], 'it should not record the field as having an error')
  t.end()
})

test('A date component is required and no input has been provided', t => {
  isRequiredStub.reset()
  isRequiredStub.returns(true)

  const dateController = new DateController()

  const errors = dateController.validate(dateComponent, getUserData())

  t.deepEqual(errors, [
    {compositeName: 'dob-day', error: true},
    {compositeName: 'dob-month', error: true},
    {compositeName: 'dob-year', error: true},
    {
      errorType: 'required',
      instance: 'dob',
      error: {compositeInput: 'day'}
    }
  ], 'it should record the field as having a required error')
  t.end()
})

test('A date component is required', t => {
  isRequiredStub.reset()
  isRequiredStub.returns(true)

  const dateController = new DateController()

  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '2',
    'dob-month': '3',
    'dob-year': '1980'
  }))

  t.deepEqual(errors, [], 'it should not record the field as having a required error')

  t.end()
})

test('A date component has a day value', t => {
  const dateController = new DateController()

  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '2',
    'dob-month': '',
    'dob-year': ''
  }))

  t.deepEqual(errors, [{compositeName: 'dob-month', error: true}, {compositeName: 'dob-year', error: true}, {errorType: 'date.missing.month.year', instance: 'dob', error: {compositeInput: 'month'}}], 'it should record the field as having a missing month and year error')

  t.end()
})

test('A date component has a month value', t => {
  const dateController = new DateController()

  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '',
    'dob-month': '2',
    'dob-year': ''
  }))

  t.deepEqual(errors, [{compositeName: 'dob-day', error: true}, {compositeName: 'dob-year', error: true}, {errorType: 'date.missing.day.year', instance: 'dob', error: {compositeInput: 'day'}}], 'it should record the field as having a missing day and year error')

  t.end()
})

test('A date component has a year value', t => {
  const dateController = new DateController()

  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '',
    'dob-month': '',
    'dob-year': '2'
  }))

  t.deepEqual(errors, [{compositeName: 'dob-day', error: true}, {compositeName: 'dob-month', error: true}, {errorType: 'date.missing.day.month', instance: 'dob', error: {compositeInput: 'day'}}], 'it should record the field as having a missing day and month error')

  t.end()
})

test('A date component has no day', t => {
  const dateController = new DateController()

  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '',
    'dob-month': '2',
    'dob-year': '2'
  }))

  t.deepEqual(errors, [{compositeName: 'dob-day', error: true}, {errorType: 'date.missing.day', instance: 'dob', error: {compositeInput: 'day'}}], 'it should record the field as having a missing day error')

  t.end()
})

test('A date component has no month', t => {
  const dateController = new DateController()

  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '2',
    'dob-month': '',
    'dob-year': '2'
  }))

  t.deepEqual(errors, [{compositeName: 'dob-month', error: true}, {errorType: 'date.missing.month', instance: 'dob', error: {compositeInput: 'month'}}], 'it should record the field as having a missing month error')

  t.end()
})

test('A date component has no year', t => {
  const dateController = new DateController()

  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '2',
    'dob-month': '2',
    'dob-year': ''
  }))
  t.deepEqual(errors, [{compositeName: 'dob-year', error: true}, {errorType: 'date.missing.year', instance: 'dob', error: {compositeInput: 'year'}}], 'it should record the field as having a missing year error')
  t.end()
})

test('A date component has an invalid date', t => {
  const dateController = new DateController()

  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '200',
    'dob-month': '2',
    'dob-year': '2'
  }))

  t.deepEqual(errors, [{compositeName: 'dob-day', error: true}, {compositeName: 'dob-month', error: true}, {compositeName: 'dob-year', error: true}, {errorType: 'date.invalid', instance: 'dob', error: {compositeInput: 'day'}}], 'it should record the field as having an invalid date error')

  t.end()
})
