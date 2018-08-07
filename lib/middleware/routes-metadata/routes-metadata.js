const router = require('express').Router()
const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {default: produce} = require('immer')

// const jp = require('jsonpath')
const {
  getTimestamp,
  getServiceInstances,
  getInstance,
  getInstanceProperty
} = require('../../service-data/service-data')

const route = require('../../route/route')
const {getNextUrl, getPreviousUrl} = route
const {
  skipPage,
  processInput,
  validateInput,
  formatProperties,
  updateControlNames,
  skipComponents,
  kludgeUpdates
} = require('../../page/page')

let pagesMethods = {}
let navigation = {}

const getPagesMethods = () => {
  return pagesMethods
}
const initRoutes = () => {
  const serviceData = getServiceInstances()
  // FBLogger({serviceData, schemas})

  // Only handle actual routes
  // TODO: remove them based on actual pageness rather than relying on _type
  const pages = deepClone(serviceData)
  Object.keys(pages).forEach(potentialPage => {
    if (!pages[potentialPage]._type.startsWith('page.')) {
      delete pages[potentialPage]
    }
  })

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

const pageHandler = (req, res, next) => {
  if (serviceDataTimestamp !== getTimestamp()) {
    initRoutes()
  }
  const url = req._parsedUrl.pathname.replace(/\/(edit|preview|flow)$/, '')

  const handlerData = pagesMethods.getData(url)

  if (!handlerData) {
    return next()
  } else {
    Object.assign(req.params, handlerData.params)
    const route = handlerData.route
    let pageInstance = deepClone(getInstance(route))
    const userData = produce(req.user, draft => {
      draft.pagesMethods = pagesMethods
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

    // Check whether page should be displayed
    if (!EDITMODE) {
      pageInstance = skipPage(pageInstance, userData)
      if (pageInstance.redirect) {
        return res.redirect(pageInstance.redirect)
      }
    }

    // Remove unneeded components
    if (EDITMODE !== 'edit') {
      pageInstance = skipComponents(pageInstance, userData)
    }

    if (POST) {
      // handle inbound values
      pageInstance = processInput(pageInstance, userData, req.body)

      // validate inbound values
      pageInstance = validateInput(pageInstance, userData)

      // go to next page if valid
      if (!EDITMODE) {
        if (pageInstance.$validated && pageInstance.nextpage) {
          const nextUrl = getNextUrl(route, userData)
          if (nextUrl) {
            return res.redirect(nextUrl)
          }
        }
      }
    }

    // Update name values
    pageInstance = updateControlNames(pageInstance, userData)

    // Format all the properties which need to be
    pageInstance = formatProperties(pageInstance, userData)

    // TODO: remove setContent method from fb-nunjucks-helpers

    // TODO: make this unnecessary
    pageInstance = kludgeUpdates(pageInstance)

    // render with Nunjucks
    renderPage(res, pageInstance)
  }
}

const renderPage = (res, pageInstance) => {
  // render with Nunjucks
  // set template path and context
  const templatePath = `${pageInstance._template || `${pageInstance._type.replace(/\./g, '/')}/template/nunjucks/${pageInstance._type}`}.njk.html`
  const context = {
    page: deepClone(pageInstance)
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

const getNavigation = (page) => {
  if (page) {
    return navigation[page]
  } else {
    return navigation
  }
}

module.exports = {
  init: metadataRouter,
  initRoutes,
  pageHandler,
  getPagesMethods,
  renderPage,
  getNavigation
}
