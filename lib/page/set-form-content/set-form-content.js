const {default: produce} = require('immer')

const {
  getString
} = require('../../service-data/service-data')

const setFormContent = async (pageInstance, userData) => {
  const req = userData.req
  pageInstance = produce(pageInstance, draft => {
    draft.backLink = getString('link.back', pageInstance.contentLang)

    const actionType = pageInstance.actionType || 'continue'
    const buttonType = `button.${actionType}`
    let continueHtml = getString(`${buttonType}.${pageInstance._type}`, pageInstance.contentLang)
    if (!continueHtml) {
      continueHtml = getString(buttonType, pageInstance.contentLang, 'Continue')
    }
    let continueClasses = getString(`${buttonType}.${pageInstance._type}.classes`) || getString(`${buttonType}.classes`)
    const resetType = `${buttonType}.reset`
    const buttonContinue = {
      _type: 'button',
      html: continueHtml,
      classes: continueClasses
    }
    let resetHtml = getString(`${resetType}.${pageInstance._type}`, pageInstance.contentLang)
    if (resetHtml === undefined) {
      resetHtml = getString(resetType, pageInstance.contentLang)
      if (resetHtml === undefined && actionType !== 'continue') {
        resetHtml = getString('button.continue.reset', pageInstance.contentLang)
      }
    }
    if (resetHtml) {
      buttonContinue.reset = resetHtml
    }
    draft.buttonContinue = buttonContinue

    // insert cookie message if needed
    if (req.newSession) {
      draft.cookieMessage = getString('cookies.message', pageInstance.contentLang)
    }
    return draft
  })
  return pageInstance
}

module.exports = setFormContent
