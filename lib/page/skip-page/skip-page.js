const {evaluateInput} = require('../../evaluate-condition/evaluate-condition')

const skipPage = (pageInstance, userData) => {
  const {getUserData} = userData
  if (pageInstance.show !== undefined) {
    const showPage = evaluateInput(pageInstance.show, getUserData())
    if (!showPage) {
      pageInstance.redirect = pageInstance.nextpage
    }
  }
  return pageInstance
}

module.exports = skipPage
