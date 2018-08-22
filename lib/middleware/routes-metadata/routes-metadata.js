const router = require('express').Router()
const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {default: produce} = require('immer')

const controllers = require('../../page/controller/controller')

// const jp = require('jsonpath')
const {
  getTimestamp,
  getPageInstancesHash,
  getInstance,
  getInstanceTitle,
  getInstanceProperty
} = require('../../service-data/service-data')

const {format} = require('../../format/format')

const route = require('../../route/route')
const {getNextPage, getNextUrl, getPreviousUrl} = route
const {
  skipPage,
  setComposite,
  setControlNames,
  setRepeatable,
  processInput,
  validateInput,
  formatProperties,
  updateControlNames,
  skipComponents,
  kludgeUpdates
} = require('../../page/page')

let pagesMethods = {}
let navigation = {}

const getNavigationPages = () => {
  return navigation
}
const getNavigation = (page) => {
  if (page) {
    return navigation[page]
  } else {
    return navigation
  }
}

const getPagesMethods = () => {
  return pagesMethods
}
const initRoutes = () => {
  const pages = getPageInstancesHash()

  // initialise route url matching and creation methods
  pagesMethods = route.init(pages)

  // temporary next and previous page handling
  // TODO: implement proper next page method
  navigation = {}
  const startPage = getInstance(pagesMethods.getData('/').route)

  const setNavigation = (_id) => {
    let nextpage
    let previouspage
    const navPage = getInstance(_id)
    const steps = navPage.steps || []
    if (steps[0]) {
      nextpage = steps[0]
    }

    const parent = getInstance(navPage._parent)
    if (parent) {
      const stepIndex = parent.steps.indexOf(_id)
      if (stepIndex) {
        let previous = parent.steps[stepIndex - 1]
        while (getInstanceProperty(previous, 'steps')) {
          const previousSteps = getInstanceProperty(previous, 'steps')
          previous = previousSteps[previousSteps.length - 1]
        }
        previouspage = previous

        if (stepIndex < parent.steps.length - 1) {
          nextpage = nextpage || parent.steps[stepIndex + 1]
        } else {
          const grandparent = getInstance(parent._parent)
          if (grandparent) {
            const grandParentStepIndex = grandparent.steps.indexOf(parent._id)
            if (grandParentStepIndex < grandparent.steps.length - 1) {
              nextpage = nextpage || grandparent.steps[grandParentStepIndex + 1]
            }
          }
        }
      } else {
        nextpage = nextpage || parent.steps[1]
        if (!nextpage) {
          const getNextFromParent = (parentId) => {
            const parent = getInstance(parentId)
            let nextpage
            const grandparent = getInstance(parent._parent)
            if (grandparent) {
              const grandParentStepIndex = grandparent.steps.indexOf(parent._id)
              if (grandParentStepIndex < grandparent.steps.length - 1) {
                nextpage = grandparent.steps[grandParentStepIndex + 1]
              } else {
                nextpage = getNextFromParent(grandparent._id)
              }
            }
            return nextpage
          }
          nextpage = getNextFromParent(parent._id)
        }
        previouspage = parent._id
      }
    }

    navigation[_id] = {
      nextpage,
      previouspage
    }

    steps.forEach((step, index) => {
      setNavigation(step)
    })
  }
  setNavigation(startPage._id)

  serviceDataTimestamp = getTimestamp()
}

const metadataRouter = () => {
  initRoutes()
  router.use(pageHandler)
  return router
}

let serviceDataTimestamp

const getRedirectUrl = (url, CHANGEPAGE) => {
  return CHANGEPAGE ? `${url}/change${CHANGEPAGE}` : url
}

const pageHandler = (req, res, next) => {
  if (serviceDataTimestamp !== getTimestamp()) {
    initRoutes()
  }
  let url = req._parsedUrl.pathname.replace(/\/(edit|preview|flow)$/, '') || '/'

  let CHANGEPAGE = req.body.changepage

  let handlerData = pagesMethods.getData(url)
  if (!handlerData && url.match(/\/change/)) {
    url = url.replace(/\/change(\/.+){0,1}$/, (m, m1) => {
      CHANGEPAGE = m1 || true
      return ''
    })
    handlerData = pagesMethods.getData(url)
  }

  if (!handlerData) {
    return next()
  } else {
    Object.assign(req.params, handlerData.params)
    const route = handlerData.route
    let pageInstance = deepClone(getInstance(route))
    if (pageInstance.namePrefix) {
      let namePrefix = format(pageInstance.namePrefix, req.params, {markdown: false})
      pageInstance.namePrefix = namePrefix
    }
    const userData = produce(req.user, draft => {
      draft.url = url
      draft.pagesMethods = pagesMethods
      draft.getNavigation = getNavigation
      draft.getNavigationPages = getNavigationPages
    })
    userData.setParams(req.params)
    const POST = req.method === 'POST'
    const EDITMODE = req.editmode

    const nextUrl = getNextUrl(route, userData)
    if (nextUrl) {
      pageInstance.nextpage = nextUrl
    }
    const previousUrl = getPreviousUrl(route, userData)
    if (previousUrl) {
      pageInstance.previouspage = previousUrl
    }

    if (CHANGEPAGE) {
      pageInstance = produce(pageInstance, draft => {
        draft.changepage = CHANGEPAGE
        return draft
      })
    }

    if (EDITMODE === 'preview') {
      pageInstance = produce(pageInstance, draft => {
        const previewNav = getNavigation(route)
        if (previewNav.nextpage) {
          draft.preview = draft.preview || {}
          draft.preview.next = {
            title: getInstanceTitle(previewNav.nextpage),
            url: `${pagesMethods.getUrl(previewNav.nextpage)}/preview`.replace(/\/\//, '/')
          }
        }
        if (previewNav.previouspage) {
          draft.preview = draft.preview || {}
          draft.preview.previous = {
            title: getInstanceTitle(previewNav.previouspage),
            url: `${pagesMethods.getUrl(previewNav.previouspage)}/preview`.replace(/\/\//, '/')
          }
        }
        return draft
      })
    }

    const controller = controllers[pageInstance._type] || {}

    // Check whether page should be displayed
    if (!EDITMODE) {
      pageInstance = skipPage(pageInstance, userData)
      if (pageInstance.redirect) {
        return res.redirect(pageInstance.redirect)
      }
    }

    if (controller.setContents) {
      pageInstance = controller.setContents(pageInstance, userData)
    }

    pageInstance = setControlNames(pageInstance, userData)
    pageInstance = setRepeatable(pageInstance, userData, EDITMODE === 'edit')
    pageInstance = setComposite(pageInstance, userData)

    // Remove unneeded components
    if (EDITMODE !== 'edit' && EDITMODE !== 'preview') {
      pageInstance = skipComponents(pageInstance, userData)
    }

    if (POST) {
      // handle inbound values
      pageInstance = processInput(pageInstance, userData, req.body)

      // remove item
      const {remove} = req.body
      if (remove) {
        const [removeLookup, removeIndex] = remove.split('=')
        // error if no such item

        const removeCount = userData.getUserCountProperty(removeLookup) || {}
        // error if no removeCount
        if (removeCount.current > removeCount.minimum) {
          const lookupArray = userData.getUserDataProperty(removeLookup)
          // error if item doesn't exist
          lookupArray.splice(removeIndex, 1)
          userData.setUserDataProperty(removeLookup, lookupArray)
          removeCount.current--
          userData.setUserCountProperty(removeLookup, removeCount)
        } else {
          // error if removing would take too low
        }

        return res.redirect(getRedirectUrl(url, CHANGEPAGE))
      }

      // validate inbound values
      pageInstance = validateInput(pageInstance, userData)

      // add another item
      const {add} = req.body
      if (add && pageInstance.$validated) {
        const addCount = userData.getUserCountProperty(add) || {}
        if (!addCount.maximum || addCount.current < addCount.maximum) {
          addCount.current++
          userData.setUserCountProperty(add, addCount)
        } else {
          // Add error - ie invalidate page and render
        }
        // redirect to self
        return res.redirect(getRedirectUrl(url, CHANGEPAGE))
      }

      // go to next page if valid
      if (!EDITMODE) {
        if (pageInstance.$validated) {
          if (CHANGEPAGE) {
            const changePageData = pagesMethods.getData(CHANGEPAGE)
            const checkNextPage = (_id, userData) => {
              if (_id === changePageData.route) {
                return {_id}
              }
              let nextPage = getNextPage(_id, userData)
              if (typeof nextPage === 'string') {
                nextPage = {_id: nextPage}
              }
              let nextPageId = nextPage._id || nextPage
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
              return checkNextPage(nextPageId, userData)
            }
            const nextPage = checkNextPage(pageInstance._id, userData)
            let nextUrl = pagesMethods.getUrl(nextPage._id, nextPage.params)
            if (nextUrl !== CHANGEPAGE) {
              nextUrl = getRedirectUrl(nextUrl, CHANGEPAGE)
            }
            return res.redirect(nextUrl)
          }
          // && pageInstance.nextpage
          const nextUrl = getNextUrl(route, userData)
          if (nextUrl) {
            return res.redirect(nextUrl)
          }
        }
      }
    }

    // Format all the properties which need to be
    pageInstance = formatProperties(pageInstance, userData)

    // Update name values
    pageInstance = updateControlNames(pageInstance, userData)

    // TODO: remove setContent method from fb-nunjucks-helpers

    // TODO: make this unnecessary
    pageInstance = kludgeUpdates(pageInstance, userData)

    // if (EDITMODE) {
    pageInstance = produce(pageInstance, draft => {
      draft.EDITMODE = EDITMODE
      draft.MODE = EDITMODE || 'live'
      draft.MODEURL = url
      return draft
    })
    // }

    // render with Nunjucks
    renderPage(res, pageInstance)
  }
}

const renderPage = (res, pageInstance) => {
  // render with Nunjucks
  // set template path and context
  const templatePath = `${pageInstance._template || `${pageInstance._type.replace(/\./g, '/')}/template/nunjucks/${pageInstance._type}`}.njk.html`
  const page = deepClone(pageInstance)
  const context = {
    page
  }
  res.nunjucksAppEnv.render(templatePath, context, (err, output) => {
    if (err) {
      // TODO: log error not console.log(err)
      res.sendStatus(404)
      return
    }
    res.send(output)
  })
}

module.exports = {
  init: metadataRouter,
  initRoutes,
  pageHandler,
  getPagesMethods,
  renderPage,
  getNavigation,
  getNavigationPages
}
