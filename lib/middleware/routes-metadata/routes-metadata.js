const router = require('express').Router()
const {default: produce} = require('immer')

const nunjucksConfiguration = require('../nunjucks-configuration/nunjucks-configuration')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const controllers = require('../../page/controller/controller')

const {
  getPageInstancesHash,
  getInstance,
  getInstanceTitle,
  getInstanceProperty,
  getString,
  getSchemaNestableProperties
} = require('../../service-data/service-data')

const {format} = require('../../format/format')

const route = require('../../route/route')
const {getPagesMethods, getNavigation, getNavigationPages} = route
const {
  getUrl,
  getData,
  getNextPage,
  getPreviousPage,
  getNextUrl,
  getPreviousUrl,
  checkPageIdParams
} = route
const {
  skipPage,
  setComposite,
  setControlNames,
  setRepeatable,
  setMultipartForm,
  processUploads,
  setUploads,
  processInput,
  validateInput,
  formatProperties,
  updateControlNames,
  setService,
  skipComponents,
  kludgeUpdates
} = require('../../page/page')

const {setEditorControls} = require('../../editor/editor')

const {GA_TRACKING_ID} = require('../../constants/constants')

let defaultLang
const initRoutes = () => {
  const pages = getPageInstancesHash()
  route.initRoutes(pages)
  defaultLang = getInstanceProperty('service', 'languageDefault') || 'en'
}

const metadataRouter = () => {
  initRoutes()
  router.use(pageHandler)
  return router
}

const getRedirectUrl = (url, CHANGEPAGE) => {
  return CHANGEPAGE ? `${url}/change${CHANGEPAGE}` : url
}

const pageHandler = async (req, res, next) => {
  let pagesMethods = getPagesMethods()

  let url = req._parsedUrl.pathname.replace(/\/(edit|preview|flow)$/, '')

  url = url || '/'

  let CHANGEPAGE = req.body.changepage

  let handlerData = getData(url)
  if (!handlerData && url.match(/\/change/)) {
    url = url.replace(/\/change(\/.+){0,1}$/, (m, m1) => {
      CHANGEPAGE = m1 || true
      return ''
    })
    handlerData = getData(url)
  }

  if (!handlerData) {
    return next()
  } else {
    req.lang = handlerData.lang || defaultLang

    Object.assign(req.params, handlerData.params)
    const route = handlerData.route
    let pageInstance = deepClone(getInstance(route))
    if (pageInstance.namePrefix) {
      let namePrefix = format(pageInstance.namePrefix, req.params, {markdown: false})
      pageInstance.namePrefix = namePrefix
    }

    const POST = req.method === 'POST'
    const EDITMODE = req.editmode
    const params = req.params

    const userData = produce(req.user, draft => {
      draft.req = req
      draft.lang = req.lang
      draft.contentLang = defaultLang !== req.lang ? req.lang : undefined
      draft.url = url
      draft.POST = POST
      draft.EDITMODE = EDITMODE
      // TODO: remove these since they're only used by the editor
      draft.pagesMethods = pagesMethods
      draft.getNavigation = getNavigation
      draft.getNavigationPages = getNavigationPages
    })
    pageInstance.contentLang = userData.contentLang
    userData.setParams(params)
    userData.setBodyInput(req.body)

    const nextUrl = getNextUrl({_id: route, params}, userData)
    if (nextUrl) {
      pageInstance.nextpage = nextUrl
    }
    const previousUrl = getPreviousUrl({_id: route, params}, userData)
    if (previousUrl) {
      pageInstance.previouspage = previousUrl
    }

    if (!EDITMODE) {
      if (req.newSession && pageInstance.previouspage) {
        return res.redirect('/')
      }
    }

    if (CHANGEPAGE) {
      pageInstance = produce(pageInstance, draft => {
        draft.changepage = CHANGEPAGE
        return draft
      })
    }

    // Check whether page should be displayed
    if (!EDITMODE) {
      pageInstance = skipPage(pageInstance, userData)
      if (pageInstance.redirect) {
        return res.redirect(pageInstance.redirect)
      }
    }

    const controller = controllers[pageInstance._type] || {}

    if (controller.setContents) {
      pageInstance = controller.setContents(pageInstance, userData, res)
    }

    pageInstance = setControlNames(pageInstance, userData)
    pageInstance = setRepeatable(pageInstance, userData, EDITMODE === 'edit')
    pageInstance = setComposite(pageInstance, userData)

    // Remove unneeded components
    if (EDITMODE !== 'edit' && EDITMODE !== 'preview') {
      pageInstance = skipComponents(pageInstance, userData)
    }

    // Handle multi-part forms and uploads
    pageInstance = await setMultipartForm(pageInstance, userData)
    if (pageInstance.encType) {
      if (req.method === 'POST') {
        pageInstance = await processUploads(pageInstance, userData)
      }
      pageInstance = await setUploads(pageInstance, userData)
    }

    if (POST) {
      // handle inbound values
      pageInstance = processInput(pageInstance, userData)

      // remove item
      const {remove} = userData.getBodyInput()
      if (remove) {
        const [removeLookup, removeIndex] = remove.split('=')
        // error if no such item

        const removeCount = userData.getUserCountProperty(removeLookup) || {}
        // error if no removeCount
        if (removeCount.current > (removeCount.minimum || 0)) {
          const lookupArray = userData.getUserDataProperty(removeLookup)
          if (lookupArray) {
          // error if item doesn't exist
            lookupArray.splice(removeIndex, 1)
            userData.setUserDataProperty(removeLookup, lookupArray)
            const compositeRemoveLookup = `COMPOSITE.${removeLookup}`
            const compositeLookupArray = userData.getUserDataProperty(compositeRemoveLookup)
            if (compositeLookupArray) {
              compositeLookupArray.splice(removeIndex, 1)
              userData.setUserDataProperty(compositeRemoveLookup, compositeLookupArray)
            }
          }
          removeCount.current--
          userData.setUserCountProperty(removeLookup, removeCount)
        } else {
          // error if removing would take too low
        }

        // VERBOSE
        await userData.saveData()
        return res.redirect(getRedirectUrl(url, CHANGEPAGE))
      }

      // add another item
      let {add} = userData.getBodyInput()
      if (add) { // } && pageInstance.$validated) {
        let repeatableId = pageInstance._repeatableId
        const addParts = add.split('/')
        if (addParts[1]) {
          repeatableId = addParts[0]
          add = addParts[1]
        }

        let defaultCurrent = 1
        if (repeatableId) {
          // const repeatableInstance = getInstance(repeatableId)
          defaultCurrent = getInstanceProperty(repeatableId, 'repeatableMinimum')
          if (defaultCurrent === undefined) {
            defaultCurrent = 1
          }
        }
        const addCount = userData.getUserCountProperty(add) || {
          current: defaultCurrent,
          minimum: defaultCurrent
        }
        if (!addCount.maximum || addCount.current < addCount.maximum) {
          addCount.current++
          userData.setUserCountProperty(add, addCount)
        } else {
          // Add error - ie invalidate page and render
        }
        if (repeatableId) {
          let repeatablePage = {_id: pageInstance._id, params}
          while (repeatablePage && repeatablePage._id !== repeatableId) {
            repeatablePage = getPreviousPage(repeatablePage, userData)
          }
          if (repeatablePage) {
            url = getUrl(repeatablePage._id, repeatablePage.params, userData.contentLang)
            // url = getPreviousUrl(repeatablePage, userData)
          }
        }
        if (!CHANGEPAGE) {
          const REFERRER = (req.get('referrer') || '').replace(/.*\/\/.*?\//, '/')
          const referrerPageData = getData(REFERRER)
          if (referrerPageData) {
            const referrerPageType = getInstanceProperty(referrerPageData.route, '_type')
            if (referrerPageType === 'page.summary') {
              const summaryOf = getInstanceProperty(referrerPageData.route, 'summaryOf')
              if (!summaryOf) {
                CHANGEPAGE = REFERRER
              }
            }
          }
        }

        // VERBOSE
        await userData.saveData()

        // redirect to self
        return res.redirect(getRedirectUrl(url, CHANGEPAGE))
      }

      const {addFile, removeFile} = userData.getBodyInput()
      const skipValidation = addFile || removeFile
      if (!skipValidation) {
        // validate inbound values
        pageInstance = validateInput(pageInstance, userData)
      }

      // VERBOSE x 3 - and why not before validation?
      await userData.saveData()

      // go to next page if valid
      if (!EDITMODE) {
        if (pageInstance.$validated) {
          if (CHANGEPAGE) {
            const changePageData = getData(CHANGEPAGE)
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
            let nextUrl = getUrl(nextPage._id, nextPage.params, userData.contentLang)
            if (nextUrl !== CHANGEPAGE) {
              nextUrl = getRedirectUrl(nextUrl, CHANGEPAGE)
            }
            return res.redirect(nextUrl)
          }
          if (controller.postValidation) {
            await controller.postValidation(pageInstance, userData)
          }

          const nextUrl = getNextUrl({_id: route, params}, userData)
          if (nextUrl) {
            return res.redirect(nextUrl)
          }
        }
      }
    }

    pageInstance = produce(pageInstance, draft => {
      draft.backLink = getString('link.back', pageInstance.contentLang)

      const actionType = getInstanceProperty(pageInstance._id, 'actionType', 'continue')
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

    // if (EDITMODE) {
    pageInstance = produce(pageInstance, draft => {
      draft.EDITMODE = EDITMODE
      draft.MODE = EDITMODE || 'live'
      draft.MODEURL = url
      return draft
    })
    // }

    pageInstance = setService(pageInstance, userData)

    // Format all the properties which need to be
    pageInstance = formatProperties(pageInstance, userData)

    // Update name values
    pageInstance = updateControlNames(pageInstance, userData)

    // TODO: remove setContent method from fb-nunjucks-helpers
    // TODO: make this unnecessary
    pageInstance = kludgeUpdates(pageInstance, userData)

    // deal with any flash messages
    const flashMessages = userData.getFlashMessages()
    if (flashMessages && flashMessages.length) {
      pageInstance = produce(pageInstance, draft => {
        draft.flashMessages = flashMessages
        return draft
      })
      userData.clearFlashMessages()
      await userData.saveData()
    }

    // Editor-specific control updates
    // TODO - move to editor
    pageInstance = await setEditorControls(pageInstance, userData)

    // Pass userdata to context
    const userdata = userData.getUserData()
    const context = {GA_TRACKING_ID, userdata, req}
    // render with Nunjucks
    renderPage(res, pageInstance, context)
  }
}

const renderPage = async (res, pageInstance, context) => {
  try {
    let output = await nunjucksConfiguration.renderPage(pageInstance, Object.assign({}, res.locals, context))
    res.send(output)
  } catch (e) {
    res.sendStatus(404)
  }
}

module.exports = {
  init: metadataRouter,
  initRoutes,
  pageHandler,
  renderPage
}
