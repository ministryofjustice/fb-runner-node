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

const transformChangePageData = ({route: _id, params} = {}) => ({_id, params})
const hasUploadComponents = ({components = []} = {}) => components.some(({_type}) => _type === 'upload')

function checkNextPage (changePage, currentPage, userData) {
  if (checkPageIdParams(changePage, currentPage)) {
    return currentPage
  }

  let nextPage = getNextPage(currentPage, userData)

  if (typeof nextPage === 'string') nextPage = {_id: nextPage}

  const {_id} = nextPage

  let pageInstance = getInstance(_id)

  /*
   *  See also `getRedirectForPreviousPage`
   *
   *  This is problematic but (for now) acceptable
   *
   *  In order to compute the next page, we transform and validate
   *  each of the pages in the journey chain. If a page does not validate
   *  we stop there
   *
   *  `upload` components may appear on a page and have either one or two steps
   *  enabling the user to check then see a summary of their uploads. But
   *  beyond the component page (in other words, once the user has progressed
   *  to either of the steps) the form data for the uploads does not exist,
   *  so it can't be revalidated
   *
   *  Consequently, pages containing `upload` components are "skipped over" for
   *  re-validation here -- they are presumed to be valid
   *
   *  At some point it may be necessary to create a better mechanism!
   */
  if (!hasUploadComponents(pageInstance)) {
    pageInstance = skipPage(pageInstance, userData)
    if (!pageInstance.redirect) {
      pageInstance = setControlNames(pageInstance, userData)
      pageInstance = setRepeatable(pageInstance, userData)
      pageInstance = setComposite(pageInstance, userData)
      pageInstance = skipComponents(pageInstance, userData)
      pageInstance = validateInput(pageInstance, userData)
      if (!pageInstance.$validated) {
        return nextPage
      }
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

module.exports = async function getRedirectForNextPage (pageInstance, userData) {
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
