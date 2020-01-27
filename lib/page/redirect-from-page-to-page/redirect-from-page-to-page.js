require('@ministryofjustice/module-alias/register-module')(module)

const {
  getRedirectUrl,
  getUrl,
  getData,
  getPage,
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

const transformChangePageData = ({ route: _id, params }) => ({ _id, params })

function checkPage (changePage, currentPage, userData) {
  if (checkPageIdParams(changePage, currentPage)) {
    return currentPage
  }

  let page = getPage(currentPage, userData)

  if (typeof page === 'string') page = { _id: page }

  const { _id } = page
  let pageInstance = getInstance(_id)
  pageInstance = skipPage(pageInstance, userData)
  if (!pageInstance.redirect) {
    pageInstance = setControlNames(pageInstance, userData)
    pageInstance = setRepeatable(pageInstance, userData)
    pageInstance = setComposite(pageInstance, userData)
    pageInstance = skipComponents(pageInstance, userData)
    pageInstance = validateInput(pageInstance, userData)
    if (!pageInstance.$validated) {
      return page
    }
  }

  return checkPage(changePage, page, userData)
}

function getUrlForChangePage (changePage, currentPage, userData) {
  const page = checkPage(changePage, currentPage, userData)

  if (page) {
    const {
      _id,
      params
    } = page

    return getUrl(_id, params, userData.contentLang)
  }
}

module.exports = async function getRedirectFromPageToPage (fromInstance, toInstance, userData) {
  const {
    $validated = false
  } = fromInstance

  if ($validated) {
    let url

    const {
      _id,
      changePage
    } = toInstance

    const params = userData.getUserParams()

    if (changePage) {
      url = getUrlForChangePage(transformChangePageData(getData(changePage)), { _id, params }, userData)

      if (url !== changePage) {
        fromInstance.redirect = getRedirectUrl(url, changePage)

        return fromInstance
      }
    }

    if (url || (url = getUrl(_id, params, userData.contentLang))) {
      fromInstance.redirect = url
    }
  }

  return fromInstance
}
