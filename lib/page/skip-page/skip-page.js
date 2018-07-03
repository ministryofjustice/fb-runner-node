const {evaluateInput} = require('../../evaluate-condition/evaluate-condition')
const {default: produce} = require('immer')

const skipPage = (pageInstance, userData) => {
  let skipPageInstance = pageInstance
  const {getUserData} = userData
  if (pageInstance.show !== undefined) {
    const showPage = evaluateInput(pageInstance.show, getUserData())
    if (!showPage) {
      skipPageInstance = produce(pageInstance, draft => {
        draft.redirect = draft.nextpage
      })
    }
  }
  return skipPageInstance
}

module.exports = skipPage
