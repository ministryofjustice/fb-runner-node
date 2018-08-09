const {default: produce} = require('immer')
const jp = require('jsonpath')

const updateLabel = (instance, prop) => {
  if (instance[prop]) {
    const html = instance[prop].html || instance[prop]
    instance[prop] = {
      html,
      classes: 'govuk-visually-hidden'
    }
  }
}

const kludgeUpdates = (pageInstance, userData) => {
  let kludgedPageInstance = produce(pageInstance, draft => {
    // TODO: make this unnecessary
    if (draft._type.match(/(singlequestion|form)/)) {
      draft._form = true
    }

    // Hide requested labels and legends
    const nameInstances = jp.query(draft, '$..[?(@.name)]')
    nameInstances.forEach(nameInstance => {
      if (nameInstance.labelhide) {
        updateLabel(nameInstance, 'legend')
        updateLabel(nameInstance, 'label')
      }
    })

    // TODO: shift this to correct place
    if (draft._type === 'page.singlequestion') {
      const question = draft.components ? draft.components[0] : undefined
      if (!question) {
        return draft
      }
      if (question._type === 'group') {
        draft.heading = question.heading
        draft.lede = question.lede
        question.heading = undefined
        question.lede = undefined
      }
      let heading = question.label || question.legend
      if (heading === undefined) {
        heading = '<i>Please set component heading</i>'
      }
      if (typeof heading === 'string' || heading === undefined) {
        heading = {
          html: heading
        }
      }
      heading.isPageHeading = true
      heading.classes = 'govuk-fieldset__legend--l govuk-label--l'
      question.label = heading
      delete question.legend
    } else {
      if (!draft.heading) {
        draft.heading = '<i>Please set page heading</i>'
      }
    }
    return draft
  })
  return kludgedPageInstance
}

module.exports = kludgeUpdates
