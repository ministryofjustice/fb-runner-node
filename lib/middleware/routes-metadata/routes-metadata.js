const router = require('express').Router()
const {deepClone} = require('@ministryofjustice/fb-utils-node')
// const jp = require('jsonpath')
const {getInstance} = require('../../service-data/service-data')

const route = require('../../route/route')
const {
  skipPage,
  processInput,
  validateInput,
  formatProperties,
  updateControlNames,
  skipComponents,
  kludgeUpdates
} = require('../../page/page')

let pagesMethods
let navigation = {}

const metadataRouter = (serviceData, schemas) => {
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
  const startPage = getInstance(pagesMethods.getData('/').route)
  const steps = startPage.steps
  steps.forEach((step, index) => {
    navigation[step] = {}
    if (!index) {
      navigation[step].previouspage = startPage._id
    } else {
      navigation[step].previouspage = steps[index - 1]
    }
    if (index < steps.length - 1) {
      navigation[step].nextpage = steps[index + 1]
    }
  })
  navigation[startPage._id] = {}
  navigation[startPage._id].nextpage = startPage.steps[0]

  router.use(pageHandler)
  return router
}

const pageHandler = (req, res, next) => {
  const url = req._parsedUrl.pathname.replace(/\/(edit|preview|flow)$/, '')

  const handlerData = pagesMethods.getData(url)

  if (!handlerData) {
    return next()
  } else {
    Object.assign(req.params, handlerData.params)
    const route = handlerData.route
    let pageInstance = deepClone(getInstance(route))
    const userData = req.user
    const POST = req.method === 'POST'
    const EDITMODE = req.editmode

    const {nextpage, previouspage} = navigation[route]
    if (nextpage) {
      pageInstance.nextpage = pagesMethods.getUrl(nextpage) // serviceData[page.nextpage].url
    }
    if (previouspage) {
      pageInstance.previouspage = pagesMethods.getUrl(previouspage) // serviceData[page.previouspage].url
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
          return res.redirect(pageInstance.nextpage)
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
    // set template path and context
    const templatePath = `${pageInstance._type.replace(/\./g, '/')}/${pageInstance._type}.njk.html`
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
}

module.exports = {
  init: metadataRouter,
  pageHandler
}
