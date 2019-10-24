const {getInstanceProperty} = require('../service-data/service-data')
const {format} = require('../format/format')

const generateEmail = (recipientType, from, subject, url, submissionId, addAttachment = true, pdfData = {}) => {
  const emailBody = recipientType => {
    let body
    if (recipientType === 'team') {
      body = getInstanceProperty('service', 'emailTemplateTeam') || 'Please find an application attached'
    } else if (recipientType === 'user') {
      body = getInstanceProperty('service', 'emailTemplateUser') || 'A copy of your application is attached'
    } else {
      body = 'A copy of the application is attached'
    }
    return body
  }

  const email = {
    recipientType: recipientType,
    type: 'email',
    from,
    subject,
    body_parts: {
      'text/plain': `${url}/${recipientType}/${submissionId}-${recipientType}`
    },
    email_body: emailBody(recipientType),
    attachments: []
  }

  if (addAttachment === true) {
    email.attachments.push({
      filename: `${submissionId}.pdf`,
      mimetype: 'application/pdf',
      type: 'output',
      pdf_data: pdfData
    })
  }

  return email
}

const emailType = {
  USER: 'user',
  TEAM: 'team'
}

const composeEmailBody = (userData, language, recipientType) => {
  let body
  if (recipientType === emailType.TEAM) {
    body = getInstanceProperty('service', 'emailTemplateTeam') || 'Please find an application attached'
  } else if (recipientType === emailType.USER) {
    body = getInstanceProperty('service', 'emailTemplateUser') || 'A copy of your application is attached'
  }

  return format(body, userData, {markdown: false, lang: language})
}


module.exports = {
  generateEmail, composeEmailBody, emailType
}
