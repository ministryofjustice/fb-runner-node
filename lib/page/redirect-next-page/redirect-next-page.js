const {default: produce} = require('immer')

const {
  getRedirectUrl,
  getUrl,
  getData,
  getNextPage,
  getNextUrl,
  checkPageIdParams
} = require('../../route/route')

const {
  getInstance
} = require('../../service-data/service-data')

const skipPage = require('../skip-page/skip-page')
const setControlNames = require('../set-control-names/set-control-names')
const setRepeatable = require('../set-repeatable/set-repeatable')
const validateInput = require('../validate-input/validate-input')

const {getInstanceController} = require('../../controller/controller')

const redirectNextPage = async (pageInstance, userData) => {
  if (pageInstance.$validated) {
    let nextUrl
    const req = userData.req
    const params = req.params
    if (pageInstance.changepage) {
      const changePageData = getData(pageInstance.changepage)
      const checkNextPage = (inputPage, userData) => {
        if (checkPageIdParams({
          _id: changePageData.route,
          params: changePageData.params
        }, inputPage)) {
          return inputPage
        }
        let nextPage = getNextPage(inputPage, userData)
        if (typeof nextPage === 'string') {
          nextPage = {_id: nextPage}
        }
        let nextPageId = nextPage._id
        let nextPageInstance = getInstance(nextPageId)
        nextPageInstance = skipPage(nextPageInstance, userData)
        if (!nextPageInstance.redirect) {
          nextPageInstance = setControlNames(nextPageInstance, userData)
          nextPageInstance = setRepeatable(nextPageInstance, userData)
          nextPageInstance = validateInput(nextPageInstance, userData)
          if (!nextPageInstance.$validated) {
            return nextPage
          }
        }
        return checkNextPage(nextPage, userData)
      }
      const nextPage = checkNextPage({_id: pageInstance._id, params}, userData)
      nextUrl = getUrl(nextPage._id, nextPage.params, userData.contentLang)
      if (nextUrl !== pageInstance.changepage) {
        nextUrl = getRedirectUrl(nextUrl, pageInstance.changepage)
      }
    } else {
      const pageController = getInstanceController(pageInstance)
      if (pageController.postValidation) {
        pageInstance = await pageController.postValidation(pageInstance, userData)
      }

      nextUrl = getNextUrl({_id: pageInstance._id, params}, userData)
    }
    if (nextUrl) {
      pageInstance = produce(pageInstance, draft => {
        draft.redirect = nextUrl
      })
    }
  }
  return pageInstance
}

module.exports = redirectNextPage
