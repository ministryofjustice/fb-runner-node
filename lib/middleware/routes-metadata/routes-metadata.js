/* eslint-disable require-atomic-updates */

require('@ministryofjustice/module-alias/register-module')(module)

const router = require('express').Router()
const jsonPath = require('jsonpath')
const deepEqual = require('fast-deep-equal')

const nunjucksConfiguration = require('~/fb-runner-node/middleware/nunjucks-configuration/nunjucks-configuration')

const cloneDeep = require('lodash.clonedeep')

const {
  getPageInstancesHash,
  getInstance,
  getInstanceProperty
} = require('~/fb-runner-node/service-data/service-data')

const { format } = require('~/fb-runner-node/format/format')
const useAsync = require('~/fb-runner-node/middleware/use-async/use-async')

const route = require('~/fb-runner-node/route/route') // yes, it's used

const {
  getPagesMethods,
  getNavigation,
  getNavigationPages,
  getUrl,
  hasUrl,
  getRedirectUrl,
  getData,
  getNextUrl,
  getPreviousUrl
} = route

const {
  skipPage,
  setComposite,
  setControlNames,
  setRepeatable,
  setMultipartForm,
  processUploads,
  removeItem,
  addItem,
  processInput,
  validateInput,
  getRedirectForNextPage,
  setFormContent,
  setDefaultValues,
  formatProperties,
  updateControlNames,
  setService,
  skipComponents,
  kludgeUpdates
} = require('~/fb-runner-node/page/page')

const {
  hasController: hasModuleController,
  getController: getModuleController
} = require('~/fb-runner-node/module/savereturn/controller/page/get-controller')

const getPageController = require('~/fb-runner-node/controller/page/get-controller')
const getComponentController = require('~/fb-runner-node/controller/component/get-controller')

const setUploads = require('~/fb-runner-node/page/set-uploads/set-uploads')
const setUploadControlsMaxSize = require('~/fb-runner-node/page/set-uploads/set-upload-controls-max-size')

const {
  setEditorModes,
  setEditorControls
} = require('~/fb-runner-node/editor/editor')

const CONSTANTS = require('~/fb-runner-node/constants/constants') // this is also used

const {
  PLATFORM_ENV,
  FORM_BUILDER_GA_TRACKING_ID,
  GA_TRACKING_ID,
  GTM_TRACKING_ID,
  EXCLUDE_FROM_SEARCH_RESULTS
} = CONSTANTS

const timeoutWarningExcludedPages = [
  'page.content',
  'page.start',
  'page.confirmation'
]

let defaultLang

function initRoutes () {
  route.initRoutes(getPageInstancesHash())

  defaultLang = getInstanceProperty('service', 'languageDefault') || 'en'
}

function metadataRouter () {
  initRoutes()
  router.use(useAsync(pageHandler))
  return router
}

const handleRedirectUrl = async (res, { url, changePage, params = {} } = {}, { contentLang }) => res.redirect(getUrl(getRedirectUrl(url, changePage), params, contentLang))

const handleRedirect = async (res, { redirect, params = {} } = {}, { contentLang }) => res.redirect(getUrl(redirect, params, contentLang))

const hasRedirectUrl = ({ url, changePage, params = {} } = {}, { contentLang }) => hasUrl(getRedirectUrl(url, changePage), params, contentLang)

const hasRedirect = (pageInstance = {}) => Reflect.has(pageInstance, 'redirect')
const getRedirect = (pageInstance = {}) => Reflect.get(pageInstance, 'redirect') // eslint-disable-line

const isSummaryPage = ({ _type } = {}) => _type === 'page.summary' // eslint-disable-line
const isConfirmationPage = ({ _type } = {}) => _type === 'page.confirmation'
const isUploadCheckPage = ({ _type } = {}) => _type === 'page.uploadCheck'
const isUploadSummaryPage = ({ _type } = {}) => _type === 'page.uploadSummary'
const hasUploadComponents = ({ components = [] } = {}) => components.some(({ _type, ...component }) => _type === 'upload' || hasUploadComponents({ ...component, _type }))

async function handleUploadCheckPage (res, pageInstance, userData) {
  const pageController = getPageController(pageInstance)

  /*
   *  Validate and post validate
   */
  const redirectInstance = await pageController.resolveRoute(
    await executePostValidation(validateInput(pageInstance, userData), userData), userData
  )

  if (hasRedirect(redirectInstance)) return handleRedirect(res, redirectInstance, userData)
  return handleRedirectUrl(res, pageInstance, userData)
}

async function handleUploadSummaryPage (res, pageInstance, userData) {
  const pageController = getPageController(pageInstance)

  if (pageController.hasRemoveUpload(userData)) {
    /*
     *  Without validate
     */
    const redirectInstance = await pageController.resolveRouteForRemoveUpload(
      await executePostValidation(pageInstance, userData), userData
    )

    if (hasRedirectUrl(redirectInstance, userData)) return handleRedirectUrl(res, redirectInstance, userData)
  } else {
    /*
     *  With validate
     */
    const redirectInstance = await pageController.resolveRoute(
      await executePostValidation(validateInput(pageInstance, userData), userData), userData
    )

    return hasRedirect(redirectInstance)
      ? handleRedirect(res, redirectInstance, userData)
      : handleRedirectUrl(res, redirectInstance, userData)
  }
}

async function executePreFlight (pageInstance, userData, ...args) {
  pageInstance = await getPageController(pageInstance)
    .preFlight(pageInstance, userData, ...args)

  /*
   *  Always go to the pageInstance in case `components` has changed
   */
  const componentInstances = jsonPath.query(pageInstance, '$..[?(@._type)]')
  for await (const componentInstance of componentInstances) {
    await getComponentController(componentInstance)
      .preFlight(componentInstance, userData, pageInstance, ...args)
  }

  return pageInstance
}

async function executeSetContents (pageInstance, userData, ...args) {
  pageInstance = await getPageController(pageInstance)
    .setContents(pageInstance, userData, ...args)

  /*
   *  Always go to the pageInstance in case `components` has changed
   */
  const componentInstances = jsonPath.query(pageInstance, '$..[?(@._type)]')
  for await (const componentInstance of componentInstances) {
    await getComponentController(componentInstance)
      .setContents(componentInstance, userData, pageInstance, ...args)
  }

  return pageInstance
}

async function executePostValidation (pageInstance, userData, ...args) {
  pageInstance = await getPageController(pageInstance)
    .postValidation(pageInstance, userData, ...args)

  /*
   *  Always go to the pageInstance in case `components` has changed
   */
  const componentInstances = jsonPath.query(pageInstance, '$..[?(@._type)]')
  for await (const componentInstance of componentInstances) {
    await getComponentController(componentInstance)
      .postValidation(componentInstance, userData, pageInstance, ...args)
  }

  return pageInstance
}

async function executePreUpdateContents (pageInstance, userData, ...args) {
  pageInstance = await getPageController(pageInstance)
    .preUpdateContents(pageInstance, userData, ...args)

  /*
   *  Always go to the pageInstance in case `components` has changed
   */
  const componentInstances = jsonPath.query(pageInstance, '$..[?(@._type)]')
  for await (const componentInstance of componentInstances) {
    await getComponentController(componentInstance)
      .preUpdateContents(componentInstance, userData, pageInstance, ...args)
  }

  return pageInstance
}

async function executePreRender (pageInstance, userData, ...args) {
  pageInstance = await getPageController(pageInstance)
    .preRender(pageInstance, userData, ...args)

  /*
   *  Always go to the pageInstance in case `components` has changed
   */
  const componentInstances = jsonPath.query(pageInstance, '$..[?(@._type)]')
  for await (const componentInstance of componentInstances) {
    await getComponentController(componentInstance)
      .preRender(componentInstance, userData, pageInstance, ...args)
  }

  return pageInstance
}

function clearSessionCookie (res) {
  return res.cookie('sessionId', '', {
    httpOnly: true,
    secure: false,
    cookiePath: '/',
    maxAge: 0
  })
}

async function pageHandler (req, res) {
  const pagesMethods = getPagesMethods()

  let url = req._parsedUrl.pathname.replace(/\/(edit|preview|flow)$/, '')

  url = url || '/'

  let {
    body: {
      changepage, // casing
      changePage: CHANGEPAGE = changepage // non-breaking
    }
  } = req

  let handlerData = getData(url)

  if (!handlerData && url.match(/\/change/)) {
    url = url.replace(/\/change(\/.+){0,1}$/, (m, m1) => {
      CHANGEPAGE = m1 || true
      return ''
    })
    handlerData = getData(url)
  }

  if (!handlerData) {
    return undefined
  } else {
    req.lang = handlerData.lang || defaultLang

    Object.assign(req.params, handlerData.params)

    const route = handlerData.route

    const POST = req.method === 'POST'
    const EDITMODE = req.editmode
    const params = req.params

    const userData = Object.assign({}, req.user, {
      lang: req.lang,
      contentLang: defaultLang !== req.lang ? req.lang : undefined,
      url,
      POST
    },
    // TODO: remove these since they're only used by the editor
    {
      EDITMODE,
      pagesMethods,
      getNavigation,
      getNavigationPages
    })
    userData.setParams(params)
    userData.setBodyInput(req.body)

    let pageInstance = cloneDeep(getInstance(route))

    pageInstance.sessionDuration = getInstanceProperty('service', 'sessionDuration')

    pageInstance.showTimeoutWarning = true
    if (pageInstance._type && (timeoutWarningExcludedPages.includes(pageInstance._type))) {
      pageInstance.showTimeoutWarning = false
    }

    const message = `Page Handler for ${pageInstance._id}: ${req.method} ${req.url}`
    userData.logger.info({
      name: 'routes-metadata-handler',
      pageInstance: pageInstance._id
    }, message)

    if (!EDITMODE) {
      if (pageInstance.inactive) {
        return undefined
      }
    }

    if (pageInstance.scope) {
      userData.setScope(pageInstance.scope)
    } else {
      pageInstance.scope = 'input'
    }

    if (pageInstance.allowQueryParams) {
      pageInstance.allowQueryParams.forEach(query => {
        const queryParam = req.params[query]
        if (queryParam !== undefined) {
          userData.setUserDataProperty(query, queryParam)
        }
      })
    }

    pageInstance.url = url
    if (pageInstance.namePrefix) {
      const namePrefix = format(pageInstance.namePrefix, req.params, { markdown: false })
      pageInstance.namePrefix = namePrefix
    }
    pageInstance.contentLang = userData.contentLang

    const nextUrl = getNextUrl({ _id: route, params }, userData)
    const previousUrl = getPreviousUrl({ _id: route, params }, userData)

    if (nextUrl) {
      pageInstance.nextpage = nextUrl
    }

    if (previousUrl) {
      pageInstance.previouspage = previousUrl
    }

    const getServiceUrl = (lang) => {
      let serviceUrl
      if (lang) {
        const langServiceUrl = `SERVICE_URL_${lang.toUpperCase()}`
        serviceUrl = CONSTANTS[langServiceUrl]
      }
      if (!serviceUrl) {
        serviceUrl = CONSTANTS.SERVICE_URL
      }
      return serviceUrl
    }

    if (pageInstance._id === 'page.start') {
      const serviceUrl = getServiceUrl(userData.contentLang)
      if (serviceUrl) {
        const referrer = req.get('Referrer') || ''
        const referrerCheck = referrer.replace(/^(https{0,1}:\/\/[^/]+)\/.*/, '$1')
        const serviceUrlCheck = serviceUrl.replace(/^(https{0,1}:\/\/[^/]+)\/.*/, '$1')
        if (referrerCheck !== serviceUrlCheck) {
          return res.redirect(serviceUrl)
        } else {
          return res.redirect(pageInstance.nextpage)
        }
      }
    }

    if (!EDITMODE) {
      if (req.newSession && pageInstance.previouspage) {
        const startPageUrl = getServiceUrl(userData.contentLang) || getUrl('page.start', {}, userData.contentLang)
        return res.redirect(startPageUrl)
      }
    }

    pageInstance = await setEditorModes(pageInstance, userData)

    if (CHANGEPAGE) {
      pageInstance.changePage = CHANGEPAGE
    }

    {
      const hasUploads = hasUploadComponents(pageInstance)

      if (hasUploads) {
        /*
         *  This
         */
        pageInstance = await setMultipartForm(pageInstance, userData)
        if (pageInstance.encType) {
          /*
           *  Then this
           */
          if (hasUploads) {
            setUploadControlsMaxSize(pageInstance)
          }

          /*
           *  Before this
           */
          if (POST) {
            pageInstance = await processUploads(pageInstance, userData)
          }

          /*
           *  And before this
           */
          if (hasUploads) {
            pageInstance = await setUploads(pageInstance, userData)
          }
        }
      }
    }

    if (!EDITMODE) {
      if (hasModuleController(route)) {
        pageInstance = await getModuleController(route)
          .preFlight(pageInstance, userData, POST)
      } else {
        pageInstance = await executePreFlight(pageInstance, userData, POST)
      }

      pageInstance = skipPage(pageInstance, userData)

      if (hasRedirect(pageInstance)) return handleRedirect(res, pageInstance, userData)
    }

    pageInstance = setControlNames(pageInstance, userData)
    pageInstance = setRepeatable(pageInstance, userData, EDITMODE === 'edit')
    pageInstance = setComposite(pageInstance, userData)

    // Remove unneeded components
    if (EDITMODE !== 'edit' && EDITMODE !== 'preview') {
      pageInstance = skipComponents(pageInstance, userData)
    }

    if (!EDITMODE) {
      if (hasModuleController(route)) {
        pageInstance = await getModuleController(route)
          .setContents(pageInstance, userData, POST)
      } else {
        pageInstance = await executeSetContents(pageInstance, userData, POST)
      }

      if (hasRedirect(pageInstance)) return handleRedirect(res, pageInstance, userData)
    }

    if (POST) {
      // handle inbound values
      pageInstance = processInput(pageInstance, userData)

      {
        // remove items
        pageInstance = await removeItem(pageInstance, userData)

        const {
          redirectToSelf
        } = pageInstance

        if (redirectToSelf) {
          await userData.saveData()

          return handleRedirectUrl(res, pageInstance, userData)
        }
      }

      {
        // add another item
        pageInstance = await addItem(pageInstance, userData)

        const {
          redirectToSelf
        } = pageInstance

        if (redirectToSelf) {
          await userData.saveData()

          return handleRedirectUrl(res, pageInstance, userData)
        }
      }

      if (isUploadCheckPage(pageInstance)) {
        if (POST) {
          return handleUploadCheckPage(res, pageInstance, userData)
        }
      }

      if (isUploadSummaryPage(pageInstance)) {
        if (POST) {
          return handleUploadSummaryPage(res, pageInstance, userData)
        }
      }

      const { addFile, removeFile, removeSlot, setupReturn } = userData.getBodyInput()
      const skipValidation = addFile || removeFile || removeSlot || setupReturn
      if (!skipValidation) {
        // validate inbound values
        pageInstance = validateInput(pageInstance, userData)

        if (hasModuleController(route)) {
          pageInstance = await getModuleController(route)
            .postValidation(pageInstance, userData)
        } else {
          pageInstance = await executePostValidation(pageInstance, userData)
        }
      }

      // VERBOSE x 3 - and why not before validation?
      await userData.saveData()
      if (setupReturn) {
        const setupReturnUrl = getUrl('return.setup', {}, userData.contentLang)
        return res.redirect(setupReturnUrl)
      }

      // go to next page if valid
      if (!EDITMODE) {
        pageInstance = await getRedirectForNextPage(pageInstance, userData)

        if (hasRedirect(pageInstance)) return handleRedirect(res, pageInstance, userData)
      }
    }

    if (isConfirmationPage(pageInstance)) clearSessionCookie(res)

    if (hasModuleController(route)) {
      pageInstance = await getModuleController(route)
        .preUpdateContents(pageInstance, userData)
    } else {
      pageInstance = await executePreUpdateContents(pageInstance, userData)
    }

    if (hasRedirect(pageInstance)) {
      await userData.saveData()

      return handleRedirect(res, pageInstance, userData)
    }

    pageInstance = setFormContent(pageInstance, userData)

    pageInstance = setService(pageInstance, userData)

    // Remove unneeded components
    if (EDITMODE !== 'edit' && EDITMODE !== 'preview') {
      pageInstance = skipComponents(pageInstance, userData)
    }

    // Set default values
    pageInstance = setDefaultValues(pageInstance, userData)

    // Update name values
    pageInstance = updateControlNames(pageInstance, userData)

    // Format all the properties which need to be
    pageInstance = formatProperties(pageInstance, userData)

    // TODO: remove setContent method from fb-components/templates/nunjucks/helpers
    // TODO: make this unnecessary
    pageInstance = kludgeUpdates(pageInstance, userData)

    const flashMessages = userData.getFlashMessages()
    if (Array.isArray(flashMessages)) {
      pageInstance.flashMessages = flashMessages.slice()
    }

    // update visited records
    if (pageInstance.previouspage && userData.getScope() === 'input') {
      const params = userData.getUserParams()
      let visitedPages = userData.getUserDataProperty('visited', [], 'visited')

      visitedPages = visitedPages.filter(visited => {
        if (visited._id !== pageInstance._id) {
          return true
        }
        return !deepEqual(params, visited.params)
      })

      visitedPages.push({
        _id: pageInstance._id,
        params,
        url
      })

      userData.setUserDataProperty('visited', visitedPages, 'visited')
      userData.setUserDataProperty('last', url, 'visited')

      await userData.saveData()
    }

    // Editor-specific control updates
    // TODO - move to editor
    pageInstance = await setEditorControls(pageInstance, userData)

    if (hasModuleController(route)) {
      pageInstance = await getModuleController(route)
        .preRender(pageInstance, userData)
    } else {
      pageInstance = await executePreRender(pageInstance, userData)
    }

    // Pass userdata to context
    const userdata = userData.getUserData()
    const { _scopes } = userData.getScopedUserData()
    const context = {
      FORM_BUILDER_GA_TRACKING_ID,
      GA_TRACKING_ID,
      GTM_TRACKING_ID,
      EXCLUDE_FROM_SEARCH_RESULTS,
      userdata,
      _scopes,
      req
    }

    /*
     *  Render with Nunjucks
     */
    await renderPage(res, pageInstance, context)

    /*
     *  Clear the flash messages only after everything else has completed?
     *
     *  We could clean up in middleware, surely ...
     */
    userData.clearFlashMessages()

    /*
     *  ... And save the change
     */
    await userData.saveData()
  }
}

async function renderPage (res, pageInstance, context) {
  try {
    const params = Object.assign({ htmlLang: pageInstance.contentLang }, res.locals, context)
    const output = await nunjucksConfiguration.renderPage(pageInstance, params)

    return res.send(output)
  } catch (e) {
    if (PLATFORM_ENV) {
      throw new Error(404)
    }

    return nunjucksConfiguration.debugError(e)
  }
}

// initRoutes, pageHandler and renderPage needed for editor
module.exports = {
  init: metadataRouter,
  initRoutes,
  pageHandler,
  renderPage
}
