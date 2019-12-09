require('@ministryofjustice/module-alias/register-module')(module)

const {
  getRedirectUrl,
  getUrl,
  getData,
  getNextPage,
  getNextUrl,
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

function checkNextPage (changePage, currentPage, userData) {
  if (checkPageIdParams(changePage, currentPage)) {
    return currentPage
  }

  let nextPage = getNextPage(currentPage, userData)

  if (typeof nextPage === 'string') nextPage = {_id: nextPage}

  const {_id} = nextPage
  let nextPageInstance = getInstance(_id)
  nextPageInstance = skipPage(nextPageInstance, userData)
  if (!nextPageInstance.redirect) {
    nextPageInstance = setControlNames(nextPageInstance, userData)
    nextPageInstance = setRepeatable(nextPageInstance, userData)
    nextPageInstance = setComposite(nextPageInstance, userData)
    nextPageInstance = skipComponents(nextPageInstance, userData)
    nextPageInstance = validateInput(nextPageInstance, userData)
    if (!nextPageInstance.$validated) {
      return nextPage
    }
  }

  return checkNextPage(changePage, nextPage, userData)
}

function getNextUrlForChangePage (changePage, currentPage, userData) {
  const nextPage = checkNextPage(changePage, currentPage, userData)

  if (nextPage) {
    const {
      _id,
      params
    } = nextPage

    return getUrl(_id, params, userData.contentLang)
  }
}

const getRedirectForNextPage = async (pageInstance, userData) => {
  const {
    $validated = false
  } = pageInstance

  if ($validated) {
    let nextUrl

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
      nextUrl = getNextUrlForChangePage(transformChangePageData(getData(changePage)), currentPage, userData)

      if (nextUrl !== changePage) {
        nextUrl = getRedirectUrl(nextUrl, changePage)
      }
    } else {
      nextUrl = getNextUrl(currentPage, userData)
    }

    if (nextUrl) {
      pageInstance.redirect = nextUrl
    }
  }

  return pageInstance
}

module.exports = getRedirectForNextPage
