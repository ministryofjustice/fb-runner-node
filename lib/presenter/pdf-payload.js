const pdfPayload = (submission) => {
  return {
    submission_id: submission.title,
    pdf_heading: submission.heading,
    pdf_subheading: submission.sectionHeading,
    sections: sections(submission.components[0])
  }
}

const sections = (section) => {
  return section.answers.map(sectionAnswer => {
    return {
      heading: sectionAnswer.heading || '',
      summary_heading: sectionAnswer.summaryHeading || '',
      questions: questions(sectionAnswer)
    }
  })
}

const questions = (section) => {
  return (section.answers || []).map(answer => {
    return {
      label: answer.key.html,
      answer: answer.value.text,
      key: answer.component
    }
  })
}

module.exports = {
  pdfPayload
}
