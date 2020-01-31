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

const transformChangePageData = ({ route: _id, params = {} } = {}) => ({ _id, params })

const isUploadCheckPage = ({ _type } = {}) => _type === 'page.uploadCheck'
const isUploadSummaryPage = ({ _type } = {}) => _type === 'page.uploadSummary'
const hasUploadComponents = ({ components = [] } = {}) => components.some(({ _type, ...component }) => _type === 'upload' || hasUploadComponents({ ...component, _type }))

function checkPreviousPage (changePage, currentPage, userData) {
  if (checkPageIdParams(changePage, currentPage)) {
    return currentPage
  }

  let previousPage = getPreviousPage(currentPage, userData)

  if (typeof previousPage === 'string') previousPage = { _id: previousPage }

  const { _id } = previousPage

  let pageInstance = getInstance(_id)

  /*
   *  See also `getRedirectForNextPage`
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
   *  `upload` component check and summary pages are dealt with in `getRedirectForPreviousPage`
   *  such that execution should not reach here. Regardless, pages containing `upload` components
   *  are presumed to be valid (because a journey can't proceed beyond an upload step until it is valid)
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
        return previousPage
      }
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

    /*
     *  Does the route have a `/change` part?
     */
    if (changePage) {
      /*
       *  If this is the check step or summary step ensure the user proceeds to the upload step
       */
      if (isUploadCheckPage(pageInstance) || isUploadSummaryPage(pageInstance)) {
        const { _id } = getPreviousPage(pageInstance, userData)
        if (hasUploadComponents(getInstance(_id))) {
          pageInstance.redirect = getRedirectUrl(getUrl(_id, params, userData.contentLang), changePage)

          return pageInstance
        }
      }

      /*
       *  The page is not a check step or summary step
       */
      previousUrl = getPreviousUrlForChangePage(transformChangePageData(getData(changePage)), currentPage, userData)

      if (previousUrl !== changePage) {
        pageInstance.redirect = getRedirectUrl(previousUrl, changePage)

        return pageInstance
      }
    }

    if (previousUrl || (previousUrl = getPreviousUrl(currentPage, userData))) {
      pageInstance.redirect = previousUrl
    }
  }

  /*
   *  There is no previous page
   */
  return pageInstance
}
