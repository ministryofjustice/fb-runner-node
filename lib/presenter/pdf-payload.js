const {
  aggregateGroups
} = require('./pdf-payload.transformers')

function pdfPayload (submission) {
  const {
    components: [
      component
    ] = []
  } = submission

  return {
    submission_id: submission.title,
    pdf_heading: submission.heading,
    pdf_subheading: submission.sectionHeading,
    sections: sections(component)
  }
}

function sections (section) {
  return section.answersList.map((answer) => {
    return {
      heading: answer.heading || '',
      summary_heading: answer.summaryHeading || '',
      questions: questions(answer)
    }
  })
}

function questions (section) {
  return (section.answers || [])
    .reduce(aggregateGroups, [])
    .map((answer) => {
      return {
        label: answer.key.text,
        answer: answer.value.machine,
        human_value: answer.value.text,
        key: answer.component
      }
    })
}

module.exports = {
  pdfPayload
}
