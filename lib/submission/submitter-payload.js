require('module-alias/register')

const {getInstanceProperty} = require('~/fb-runner-node/service-data/service-data')
const {format} = require('~/fb-runner-node/format/format')

const generateEmail = (recipientType, from, subject, submissionId, includePdf = true, emailBody) => {
  const email = {
    recipientType: recipientType,
    type: 'email',
    from,
    subject,
    email_body: emailBody,
    include_pdf: includePdf,
    include_attachments: recipientType === 'team',
    attachments: []
  }

  if (includePdf === true) {
    email.attachments.push({
      filename: `${submissionId}.pdf`,
      mimetype: 'application/pdf',
      type: 'output'
    })
  }

  return email
}

const emailTypes = {
  USER: 'user',
  TEAM: 'team'
}

const composeEmailBody = (userData, language, recipientType) => {
  let body
  switch (recipientType) {
    case emailTypes.TEAM:
      body = getInstanceProperty('service', 'emailTemplateTeam') || 'Please find an application attached'
      break
    case emailTypes.USER:
      body = getInstanceProperty('service', 'emailTemplateUser') || 'A copy of your application is attached'
      break
    default:
      throw new Error(`unknown emailType. Valid types are: ${JSON.stringify(emailTypes)}`)
  }

  return format(body, userData, {markdown: false, lang: language})
}

module.exports = {
  generateEmail, composeEmailBody, emailTypes
}
