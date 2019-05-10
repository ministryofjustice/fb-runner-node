const {default: produce} = require('immer')

const skipPage = (pageInstance, userData) => {
  if (pageInstance._type === 'page.confirmation') {
    return pageInstance
  }
  let skipPageInstance = produce(pageInstance, draft => {
    if (draft.show !== undefined) {
      const showPage = userData.evaluate(draft.show)
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
