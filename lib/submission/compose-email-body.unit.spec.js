'use strict'

require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const {stub} = require('sinon')

const serviceData = require('~/fb-runner-node/service-data/service-data')
const getInstancePropertyStub = stub(serviceData, 'getInstanceProperty')

const {composeEmailBody, emailTypes} = require('./submitter-payload')

test('supplying a invlid email type will thow an error', function (t) {
  t.throws(composeEmailBody, new Error())
  t.end()
})

test('Composing the default email body for Team recipient', function (t) {
  t.equals(composeEmailBody({}, 'en', emailTypes.TEAM), 'Please find an application attached', 'returns the default string')
  t.end()
})

test('Composing the default email body for User recipient', function (t) {
  t.equals(composeEmailBody({}, 'en', emailTypes.USER), 'A copy of your application is attached', 'returns the default string')
  t.end()
})

test('Composing the email body with variables in the content', function (t) {
  const editorDefinedBody = 'Dear {fullname}. A copy of your IoJ application is attached.'
  getInstancePropertyStub.withArgs('service', 'emailTemplateUser').returns(editorDefinedBody)

  t.equals(composeEmailBody({fullname: 'Bob'}, 'en', emailTypes.USER), 'Dear Bob. A copy of your IoJ application is attached.', 'returns the formated string')
  t.end()
})

test('Composing the email body with variables in the content', function (t) {
  const editorDefinedBody = '{fullname} has submitted a new applcation'
  getInstancePropertyStub.withArgs('service', 'emailTemplateTeam').returns(editorDefinedBody)

  t.equals(composeEmailBody({fullname: 'ALice'}, 'en', emailTypes.TEAM), 'ALice has submitted a new applcation', 'returns the formated string')
  t.end()
})
