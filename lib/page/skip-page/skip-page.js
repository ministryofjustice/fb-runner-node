const {evaluateInput} = require('../../evaluate-condition/evaluate-condition')
const {default: produce} = require('immer')

const skipPage = (pageInstance, userData) => {
  if (pageInstance._type === 'page.confirmation') {
    return pageInstance
  }
  let skipPageInstance = produce(pageInstance, draft => {
    const {getUserData} = userData
    if (draft.show !== undefined) {
      const showPage = evaluateInput(draft.show, getUserData())
      if (!showPage) {
        draft.$skipPage = true
        if (!draft.nextpage) {
          throw new Error(404)
        } else {
          draft.redirect = draft.nextpage
        }
      }
    }
  })

  return skipPageInstance
}

module.exports = skipPage
