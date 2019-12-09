require('@ministryofjustice/module-alias/register-module')(module)

const {
  getRedirectUrl,
  getUrl,
  getData,
  getPreviousPage,
  getPreviousUrl,
  checkPageIdParams
} = require('~/fb-runner-node/route/route')

const {
  getInstance
} = require('~/fb-runner-node/service-data/service-data')

const skipPage = require('~/fb-runner-node/page/skip-page/skip-page')
const setControlNames = require('~/fb-runner-node/page/set-control-names/set-control-names')
const setComposite = require('~/fb-runner-node/page/set-composite/set-composite')
const setRepeatable = require('~/fb-runner-node/page/set-repeatable/set-repeatable')
const skipComponents = require('~/fb-runner-node/page/skip-components/skip-components')
const validateInput = require('~/fb-runner-node/page/validate-input/validate-input')

const transformChangePageData = ({route: _id, params}) => ({_id, params})

function checkPreviousPage (changePage, currentPage, userData) {
  if (checkPageIdParams(changePage, currentPage)) {
    return currentPage
  }

  let previousPage = getPreviousPage(currentPage, userData)

  if (typeof previousPage === 'string') previousPage = {_id: previousPage}

  const {_id} = previousPage
  let pageInstance = getInstance(_id)
  pageInstance = skipPage(pageInstance, userData)
  if (!pageInstance.redirect) {
    pageInstance = setControlNames(pageInstance, userData)
    pageInstance = setRepeatable(pageInstance, userData)
    pageInstance = setComposite(pageInstance, userData)
    pageInstance = skipComponents(pageInstance, userData)
    pageInstance = validateInput(pageInstance, userData)
    if (!pageInstance.$validated) {
      return previousPage
    }
  }

  return checkPreviousPage(changePage, previousPage, userData)
}

function getPreviousUrlForChangePage (changePage, currentPage, userData) {
  const previousPage = checkPreviousPage(changePage, currentPage, userData)

  if (previousPage) {
    const {
      _id,
      params
    } = previousPage

    return getUrl(_id, params, userData.contentLang)
  }
}

module.exports = async function getRedirectForPreviousPage (pageInstance, userData) {
  const {
    $validated = false
  } = pageInstance

  if ($validated) {
    let previousUrl

    const {
      _id,
      changePage
    } = pageInstance

    const params = userData.getUserParams()

    const currentPage = {
      _id,
      params
    }

    if (changePage) {
      previousUrl = getPreviousUrlForChangePage(transformChangePageData(getData(changePage)), currentPage, userData)

      if (previousUrl !== changePage) {
        previousUrl = getRedirectUrl(previousUrl, changePage)
      }
    } else {
      previousUrl = getPreviousUrl(currentPage, userData)
    }

    if (previousUrl) {
      pageInstance.redirect = previousUrl
    }
  }

  return pageInstance
}
