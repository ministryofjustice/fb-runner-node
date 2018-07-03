const {default: produce} = require('immer')

const kludgeUpdates = (pageInstance) => {
  let kludgedPageInstance = produce(pageInstance, draft => {
    // TODO: make this unnecessary
    if (draft._type.match(/(singlequestion|form)/)) {
      draft._form = true
    }

    // TODO: shift this to correct place
    if (draft._type === 'page.singlequestion') {
      const question = draft.components[0]
      if (typeof question.label === 'string') {
        question.label = {
          html: question.label
        }
      }
      question.label.isPageHeading = true
      question.label.classes = 'govuk-fieldset__legend--l govuk-label--l'
    }
    return draft
  })
  return kludgedPageInstance
}

module.exports = kludgeUpdates
