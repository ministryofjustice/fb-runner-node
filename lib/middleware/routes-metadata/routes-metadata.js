const router = require('express').Router()
const {default: produce} = require('immer')
const jp = require('jsonpath')

const nunjucksConfiguration = require('../nunjucks-configuration/nunjucks-configuration')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const {
  getPageInstancesHash,
  getInstance,
  getInstanceProperty
} = require('../../service-data/service-data')

const {format} = require('../../format/format')

const route = require('../../route/route')
const {getPagesMethods, getNavigation, getNavigationPages} = route
const {
  getUrl,
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
  setUploads,
  removeItem,
  addItem,
  processInput,
  validateInput,
  redirectNextPage,
  setFormContent,
  formatProperties,
  updateControlNames,
  setService,
  skipComponents,
  kludgeUpdates
} = require('../../page/page')
const {
  getInstanceController,
  getModules
} = require('../../controller/controller')

const {
  setEditorModes,
  setEditorControls
} = require('../../editor/editor')

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

    const POST = req.method === 'POST'
    const EDITMODE = req.editmode
    const params = req.params

    const userData = produce(req.user, draft => {
      draft.lang = req.lang
      draft.contentLang = defaultLang !== req.lang ? req.lang : undefined
      draft.url = url
      draft.POST = POST
      // TODO: remove these since they're only used by the editor
      draft.EDITMODE = EDITMODE
      draft.pagesMethods = pagesMethods
      draft.getNavigation = getNavigation
      draft.getNavigationPages = getNavigationPages
    })
    userData.setParams(params)
    userData.setBodyInput(req.body)

    let pageInstance = deepClone(getInstance(route))

    if (!EDITMODE) {
      if (pageInstance.inactive) {
        return next()
      }
    }

    if (pageInstance.scope) {
      userData.setScope(pageInstance.scope)
    }

    pageInstance.url = url
    if (pageInstance.namePrefix) {
      let namePrefix = format(pageInstance.namePrefix, req.params, {markdown: false})
      pageInstance.namePrefix = namePrefix
    }
    pageInstance.contentLang = userData.contentLang

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

    pageInstance = await setEditorModes(pageInstance, userData)

    if (CHANGEPAGE) {
      pageInstance = produce(pageInstance, draft => {
        draft.changepage = CHANGEPAGE
        return draft
      })
    }

    // Check whether page should be displayed
    if (!EDITMODE) {
      try {
        pageInstance = skipPage(pageInstance, userData)
      } catch (e) {
        return next(e)
      }
      if (pageInstance.redirect) {
        return res.redirect(pageInstance.redirect)
      }
    }

    const pageController = getInstanceController(pageInstance)
    const modules = getModules()

    if (pageController.setContents) {
      pageInstance = pageController.setContents(pageInstance, userData, res)
    }

    pageInstance = setControlNames(pageInstance, userData)
    pageInstance = setRepeatable(pageInstance, userData, EDITMODE === 'edit')
    pageInstance = setComposite(pageInstance, userData)

    // TODO: consider moving this back to content updates and rerunning skip components
    pageInstance = setService(pageInstance, userData)

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

      const redirectToSelf = async () => {
        await userData.saveData()
        return res.redirect(getRedirectUrl(pageInstance.url, pageInstance.changepage))
      }

      // remove items
      pageInstance = await removeItem(pageInstance, userData)
      if (pageInstance.redirectToSelf) {
        return redirectToSelf()
      }

      // add another item
      pageInstance = await addItem(pageInstance, userData)
      if (pageInstance.redirectToSelf) {
        return redirectToSelf()
      }

      const {addFile, removeFile, removeSlot, setupReturn} = userData.getBodyInput()
      const skipValidation = addFile || removeFile || removeSlot || setupReturn
      if (!skipValidation) {
        // validate inbound values
        pageInstance = validateInput(pageInstance, userData)
        // run any post validation code
        if (pageController.postValidation) {
          pageInstance = await pageController.postValidation(pageInstance, userData)
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
        try {
          pageInstance = await redirectNextPage(pageInstance, userData)
          if (pageInstance.redirect) {
            const redirectUrl = getUrl(pageInstance.redirect, {}, userData.contentLang)
            return res.redirect(redirectUrl)
          }
        } catch (e) {
          return next(e)
        }
      }
    }

    // TODO: can this move before setupReturn and avoid repeated redirect code
    if (pageController.preUpdateContents) {
      try {
        pageInstance = await pageController.preUpdateContents(pageInstance, userData)
      } catch (e) {
        return next(e)
      }

      await userData.saveData()

      // maybe an idea to make saveData check current data against previously saved
      if (pageInstance.redirect) {
        const redirectUrl = getUrl(pageInstance.redirect, {}, userData.contentLang)
        return res.redirect(redirectUrl)
      }
    }
    pageInstance = produce(pageInstance, draft => {
      const componentInstances = jp.query(draft, '$..[?(@._type)]')
      componentInstances.forEach(componentInstance => {
        const componentInstanceController = getInstanceController(componentInstance)
        if (componentInstanceController.preUpdateContents) {
          componentInstance = componentInstanceController.preUpdateContents(componentInstance, userData)
        }
      })
      return draft
    })

    pageInstance = await setFormContent(pageInstance, userData)

    // pageInstance = setService(pageInstance, userData)

    // pageInstance = skipComponents(pageInstance, userData)

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

    if (pageController.preRender) {
      try {
        pageInstance = await pageController.preRender(pageInstance, userData)
      } catch (e) {
        return next(e)
      }
    }

    for (let [key, {preRender}] of Object.entries(modules)) {
      if (preRender) {
        pageInstance = await modules[key].preRender(pageInstance, userData)
      }
    }

    // Pass userdata to context
    const userdata = userData.getUserData()
    const context = {GA_TRACKING_ID, userdata, req}
    // render with Nunjucks
    renderPage(res, pageInstance, context)
  }
}

const renderPage = async (res, pageInstance, context) => {
  try {
    let output = await nunjucksConfiguration.renderPage(pageInstance, Object.assign({
      htmlLang: pageInstance.contentLang
    }, res.locals, context))
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
