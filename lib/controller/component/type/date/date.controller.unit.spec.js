const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const validateInput = require('../../../../page/validate-input/validate-input')
const isRequiredStub = stub(validateInput, 'isRequired')

const serviceData = require('../../../../service-data/service-data')
const getServiceSchemaStub = stub(serviceData, 'getServiceSchema')
getServiceSchemaStub.returns({
  composite: ['day', 'month', 'year'],
  properties: {
    dateType: {
      default: 'day-month-year'
    }
  }
})

const dateController = proxyquire('./date.controller', {
  '../../../../page/validate-input/validate-input': validateInput,
  '../../../../service-data/service-data': serviceData
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

// Example error object list
// [
//   {compositeName: 'dob-month', error: true},
//   {compositeName: 'dob-year', error: true},
//   // controls named dob-month and dob-year will have an error class applied to them
//   {errorType: 'date.missing.month.year', instance: 'dob', error: {compositeInput: 'month'}}
//   // the component instance with _id dob will be marked as having an error
//   // and the its composite field month (ie dob-month) will be use as the contol to target from the error summary
// ]

test('When a date field is not required and no input has been provided', t => {
  isRequiredStub.reset()
  isRequiredStub.returns(false)

  const errors = dateController.validate(dateComponent, getUserData())
  t.deepEqual(errors, [], 'it should not record the field as having an error')
  t.end()
})

test('When a date field is required and no input has been provided', t => {
  isRequiredStub.reset()
  isRequiredStub.returns(true)

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

test('When a date field is required and the input has been provided', t => {
  isRequiredStub.reset()
  isRequiredStub.returns(true)

  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '2',
    'dob-month': '3',
    'dob-year': '1980'
  }))
  t.deepEqual(errors, [], 'it should not record the field as having a required error')
  t.end()
})

test('When a date field has only a day value provided', t => {
  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '2',
    'dob-month': '',
    'dob-year': ''
  }))
  t.deepEqual(errors, [{compositeName: 'dob-month', error: true}, {compositeName: 'dob-year', error: true}, {errorType: 'date.missing.month.year', instance: 'dob', error: {compositeInput: 'month'}}], 'it should record the field as having a missing month and year error')
  t.end()
})

test('When a date field has only a month value provided', t => {
  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '',
    'dob-month': '2',
    'dob-year': ''
  }))
  t.deepEqual(errors, [{compositeName: 'dob-day', error: true}, {compositeName: 'dob-year', error: true}, {errorType: 'date.missing.day.year', instance: 'dob', error: {compositeInput: 'day'}}], 'it should record the field as having a missing day and year error')
  t.end()
})

test('When a date field has only a year value provided', t => {
  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '',
    'dob-month': '',
    'dob-year': '2'
  }))
  t.deepEqual(errors, [{compositeName: 'dob-day', error: true}, {compositeName: 'dob-month', error: true}, {errorType: 'date.missing.day.month', instance: 'dob', error: {compositeInput: 'day'}}], 'it should record the field as having a missing day and month error')
  t.end()
})

test('When a date field has no day provided', t => {
  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '',
    'dob-month': '2',
    'dob-year': '2'
  }))
  t.deepEqual(errors, [{compositeName: 'dob-day', error: true}, {errorType: 'date.missing.day', instance: 'dob', error: {compositeInput: 'day'}}], 'it should record the field as having a missing day error')
  t.end()
})

test('When a date field has no month provided', t => {
  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '2',
    'dob-month': '',
    'dob-year': '2'
  }))
  t.deepEqual(errors, [{compositeName: 'dob-month', error: true}, {errorType: 'date.missing.month', instance: 'dob', error: {compositeInput: 'month'}}], 'it should record the field as having a missing month error')
  t.end()
})

test('When a date field has no year provided', t => {
  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '2',
    'dob-month': '2',
    'dob-year': ''
  }))
  t.deepEqual(errors, [{compositeName: 'dob-year', error: true}, {errorType: 'date.missing.year', instance: 'dob', error: {compositeInput: 'year'}}], 'it should record the field as having a missing year error')
  t.end()
})

test('When a date field is given an invalid date', t => {
  const errors = dateController.validate(dateComponent, getUserData({
    'dob-day': '200',
    'dob-month': '2',
    'dob-year': '2'
  }))
  t.deepEqual(errors, [{compositeName: 'dob-day', error: true}, {compositeName: 'dob-month', error: true}, {compositeName: 'dob-year', error: true}, {errorType: 'date.invalid', instance: 'dob', error: {compositeInput: 'day'}}], 'it should record the field as having an invalid date error')
  t.end()
})
