'use strict'

const test = require('tape')
const {generateEmail} = require('./submitter-payload')

const from = 'bob@example.com'
const subject = 'some subject'
const url = 'some-url/foo'
const submissionId = 'abc123'

test('Generating a user submission email with an attachment', async t => {
  const addAttachment = true
  const result = generateEmail('user', from, subject, url, submissionId, addAttachment)

  const expectedResult = {
    recipientType: 'user',
    type: 'email',
    from,
    subject,
    body_parts: {
      'text/plain': 'some-url/foo/user/abc123-user'
    },
    attachments: [{
      url: '/api/submitter/pdf/default/user/abc123-user.pdf',
      filename: 'abc123.pdf',
      mimetype: 'application/pdf',
      type: 'output'
    }]
  }

  t.deepEquals(expectedResult, result, 'it should generate the user payload')
  t.end()
})

test('Generating a user submission email without an attachment', async t => {
  const addAttachment = false
  const result = generateEmail('user', from, subject, url, submissionId, addAttachment)

  t.deepEquals(result.attachments, [], 'it should have empty attachments')
  t.end()
})

test('Generating a team submission email', async t => {
  const addAttachment = true
  const result = generateEmail('team', from, subject, url, submissionId, addAttachment)

  t.deepEquals(result.recipientType, 'team', 'it should populate the recipient type')
  t.deepEquals(result.body_parts['text/plain'], 'some-url/foo/team/abc123-team', 'it should have a body with a link for the team')
  t.deepEquals(result.attachments[0].url, '/api/submitter/pdf/default/team/abc123-team.pdf', 'it should have an attachment with a link for the team')
  t.end()
})
