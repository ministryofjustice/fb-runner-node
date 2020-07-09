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

const transformChangePageData = ({ route: _id, params = {} } = {}) => ({ _id, params })

const isUploadCheckPage = ({ _type }) => _type === 'page.uploadCheck'
const isUploadSummaryPage = ({ _type }) => _type === 'page.uploadSummary'
const hasUploadComponents = ({ components = [] } = {}) => components.some(({ _type, ...component }) => _type === 'upload' || hasUploadComponents({ ...component, _type }))

function checkNextPage (changePage, currentPage, userData) {
  if (checkPageIdParams(changePage, currentPage)) {
    return currentPage
  }

  let nextPage = getNextPage(currentPage, userData)

  if (typeof nextPage === 'string') nextPage = { _id: nextPage }

  const { _id } = nextPage

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
   *  Pages containing `upload` components are dealt with in `getRedirectForNextPage`
   *  such that execution should not reach here. Regardless, they are presumed to be
   *  valid (because a journey can't proceed beyond an upload step until it is valid)
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

    /*
     *  Does the route have a `/change` part?
     */
    if (changePage) {
      /*
       *  If this page has upload components, ensure that the user proceeds to the check step
       */
      if (hasUploadComponents(pageInstance)) {
        const { _id } = getNextPage(pageInstance, userData)
        if (isUploadCheckPage(getInstance(_id))) {
          pageInstance.redirect = getRedirectUrl(getUrl(_id, params, userData.contentLang), changePage)

          return pageInstance
        }
      }

      /*
       *  If this is the check step, ensure the user proceeds to the summary step
       *  (if it is present)
       */
      if (isUploadCheckPage(pageInstance)) {
        const { _id } = getNextPage(pageInstance, userData)
        if (isUploadSummaryPage(getInstance(_id))) {
          pageInstance.redirect = getRedirectUrl(getUrl(_id, params, userData.contentLang), changePage)

          return pageInstance
        }
      }

      /*
       *  The page does not have upload components nor is it a check step
       */
      nextUrl = getNextUrlForChangePage(
        transformChangePageData(getData(changePage)),
        currentPage,
        userData
      )

      if (nextUrl !== changePage) {
        pageInstance.redirect = getRedirectUrl(nextUrl, changePage)

        return pageInstance
      }
    }

    const checkNextPage = getInstance(getNextPage(currentPage, userData)._id)

    // if the next page has upload components
    if (hasUploadComponents(checkNextPage)) {
      // And the next page has a conditionality.
      // We don't want to do anything if the next page don't have conditionals.
      if (checkNextPage.show) {
        const verifyCondition = userData.evaluate(
          checkNextPage.show, {
            pageInstance,
            instance: pageInstance
          })

        // if the next page match the criteria
        if (verifyCondition) {
          pageInstance.redirect = checkNextPage.url

          return pageInstance
        }
      }
    }

    // If user change answer on check answer page and
    // the user answer goes to an exit page we need to re-valuate the conditions
    // and redirect the user to the exit page.
    //
    // Caveat: Save and return feature is considered an exit page. We don't
    // want to halt execution when saving your progress. Then we continue the
    // flow when the next page contains save and return scope.
    //
    if (checkNextPage && checkNextPage.show && checkNextPage.scope !== 'savereturn') {
      const verifyCondition = userData.evaluate(
        checkNextPage.show, { pageInstance, instance: pageInstance }
      )

      // if the next page match the criteria
      if (verifyCondition) {
        pageInstance.redirect = checkNextPage.url

        return pageInstance
      }
    }

    /*
     *  Either `nextUrl` is defined so we can redirect there
     *  or we can try defining `nextUrl` with `getNextUrl`
     */
    if (nextUrl || (nextUrl = getNextUrl(currentPage, userData))) {
      pageInstance.redirect = nextUrl
    }
  }

  /*
   *  There is no next page
   */
  return pageInstance
}
