'use strict'

const test = require('tape')
const {stub, spy} = require('sinon')

const serviceData = require('../service-data/service-data')
const getInstancePropertyStub = stub(serviceData, 'getInstanceProperty')

const {composeEmailBody, emailType} = require('./submitter-payload')

getInstancePropertyStub.callsFake((_id, type) => {
  const matches = {
    isConfirmation: 'page.confirmation',
    fauxConfirmation: 'page.content'
  }

  return type === '_type' ? matches[_id] : undefined
})


const from = 'bob@example.com'
const subject = 'some subject'
const url = 'some-url/foo'
const submissionId = 'abc123'

test('Composing the default email body for Team recipient', function (t) {
  t.equals(composeEmailBody({}, 'en', emailType.TEAM), 'Please find an application attached', 'returns the default string')
  t.end()
})

test('Composing the default email body for User recipient', function (t) {
  t.equals(composeEmailBody({}, 'en', emailType.USER), 'A copy of your application is attached', 'returns the default string')
  t.end()
})

test('Composing the email body with variables in the content', function (t) {
  const editorDefinedBody = "Dear {fullname}. A copy of your IoJ application is attached."
  getInstancePropertyStub.withArgs('service', 'emailTemplateUser').returns(editorDefinedBody)

  t.equals(composeEmailBody({fullname: 'Bob'}, 'en', emailType.USER), 'Dear Bob. A copy of your IoJ application is attached.', 'returns the formated string')
  t.end()
})

test('Composing the email body with variables in the content', function (t) {
  const editorDefinedBody = "{fullname} has submitted a new applcation"
  getInstancePropertyStub.withArgs('service', 'emailTemplateTeam').returns(editorDefinedBody)

  t.equals(composeEmailBody({fullname: 'ALice'}, 'en', emailType.TEAM), 'ALice has submitted a new applcation', 'returns the formated string')
  t.end()
})
