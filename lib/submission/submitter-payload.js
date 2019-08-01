const generateEmail = (recipientType, from, subject, url, submissionId, addAttachment = true) => {
  const email = {
    recipientType: recipientType,
    type: 'email',
    from,
    subject,
    body_parts: {
      'text/plain': `${url}/${recipientType}/${submissionId}-${recipientType}`
    },
    attachments: []
  }

  if (addAttachment === true) {
    email.attachments.push({
      url: `/api/submitter/pdf/default/${recipientType}/${submissionId}-${recipientType}.pdf`,
      filename: `${submissionId}.pdf`,
      mimetype: 'application/pdf',
      type: 'output'
    })
  }

  return email
}

module.exports = {
  generateEmail
}
