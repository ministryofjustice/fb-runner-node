const generateEmail = (recipientType, from, subject, url, submissionId, addAttachment = true, pdfData = {}) => {
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
      filename: `${submissionId}.pdf`,
      mimetype: 'application/pdf',
      type: 'output',
      pdf_data: pdfData
    })
  }

  return email
}

module.exports = {
  generateEmail
}
