'use strict'

const test = require('tape')
const { generateEmail } = require('./submitter-payload')

const from = 'bob@example.com'
const subject = 'some subject'
const submissionId = 'abc123'
const emailBody = 'a email body'

test('Generating a user submission email with a PDF', async t => {
  const includePdf = true
  const result = generateEmail('user', from, subject, submissionId, includePdf, emailBody)

  const expectedResult = {
    recipientType: 'user',
    type: 'email',
    from,
    subject,
    email_body: emailBody,
    include_pdf: true,
    include_attachments: false,
    attachments: [{
      filename: 'abc123.pdf',
      mimetype: 'application/pdf',
      type: 'output'
    }]
  }

  t.deepEquals(expectedResult, result, 'it should generate the user payload')
  t.end()
})

test('Generating a user submission email without a PDF', async t => {
  const includePdf = false
  const result = generateEmail('user', from, subject, submissionId, includePdf, emailBody)

  t.deepEquals(result.attachments, [], 'it should have empty attachments')
  t.end()
})

test('Attachments are included for a team submission', async t => {
  const result = generateEmail('team', from, subject, submissionId, false, emailBody)

  t.deepEquals(result.include_attachments, true, 'it add attachments for a team email')
  t.end()
})

test('Attachments are not included for a user submission', async t => {
  const result = generateEmail('user', from, subject, submissionId, false, emailBody)

  t.deepEquals(result.include_attachments, false, 'it should not include attachments for user emails')
  t.end()
})
