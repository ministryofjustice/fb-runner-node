require('module-alias/register')

const {getInstanceController} = require('~/controller/controller')
const {formatProperties} = require('~/page/page')

const submissionDataWithLabels = (title, heading, subHeading, userData) => {
  const answersComponent = {
    _id: 'page.summary.answers',
    _type: 'answers',
    onlyShowCompletedAnswers: false
  }

  const pageInstance = {
    _type: 'output.pdf',
    title: title,
    sectionHeading: subHeading,
    heading,
    columns: 'full',
    isPdf: true,
    components: [answersComponent]
  }

  const answersController = getInstanceController(answersComponent)
  answersController.preUpdateContents(answersComponent, userData, pageInstance)

  return formatProperties(pageInstance, userData)
}

module.exports = {
  submissionDataWithLabels
}
