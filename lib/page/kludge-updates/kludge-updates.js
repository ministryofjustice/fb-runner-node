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
      let heading = question.label || question.legend
      if (typeof heading === 'string') {
        heading = {
          html: heading
        }
      }
      heading.isPageHeading = true
      heading.classes = 'govuk-fieldset__legend--l govuk-label--l'
      question.label = heading
      delete question.legend
    }
    return draft
  })
  return kludgedPageInstance
}

module.exports = kludgeUpdates
