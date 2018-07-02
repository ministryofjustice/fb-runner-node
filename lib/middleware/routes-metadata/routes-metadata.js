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
  skipComponents
} = require('../../page/page')

let pagesMethods

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
    if (!index) {
      serviceData[step].previouspage = startPage._id
    } else {
      serviceData[step].previouspage = steps[index - 1]
    }
    if (index < steps.length - 1) {
      serviceData[step].nextpage = steps[index + 1]
    }
  })
  startPage.nextpage = startPage.steps[0]

  router.use(pageHandler)
  return router
}

const pageHandler = (req, res, next) => {
  const url = req._parsedUrl.pathname
  const handlerData = pagesMethods.getData(url)

  if (!handlerData) {
    next()
  } else {
    Object.assign(req.params, handlerData.params)
    const route = handlerData.route
    const pageInstance = deepClone(getInstance(route))
    const userData = req.user
    const POST = req.method === 'POST'

    if (pageInstance.nextpage) {
      pageInstance.nextpage = pagesMethods.getUrl(pageInstance.nextpage) // serviceData[page.nextpage].url
    }
    if (pageInstance.previouspage) {
      pageInstance.previouspage = pagesMethods.getUrl(pageInstance.previouspage) // serviceData[page.previouspage].url
    }

    // Check whether page should be displayed
    skipPage(pageInstance, userData)
    if (pageInstance.redirect) {
      return res.redirect(pageInstance.redirect)
    }

    // Remove unneeded components
    skipComponents(pageInstance, userData)

    if (POST) {
      // handle inbound values
      processInput(pageInstance, userData, req.body)

      // validate inbound values
      validateInput(pageInstance, userData)

      // go to next page if valid
      if (pageInstance.$validated && pageInstance.nextpage) {
        return res.redirect(pageInstance.nextpage)
      }
    }

    // Update name values
    updateControlNames(pageInstance, userData)

    // Format all the properties which need to be
    formatProperties(pageInstance, userData)

    // TODO: remove setContent method from fb-nunjucks-helpers

    // TODO: make this unnecessary
    if (pageInstance._type.match(/(singlequestion|form)/)) {
      pageInstance._form = true
    }

    // TODO: shift this to correct place
    if (pageInstance._type === 'page.singlequestion') {
      const question = pageInstance.components[0]
      if (typeof question.label === 'string') {
        question.label = {
          html: question.label
        }
      }
      question.label.isPageHeading = true
      question.label.classes = 'govuk-fieldset__legend--l govuk-label--l'
    }

    // render with Nunjucks
    // set template path and context
    const templatePath = `${pageInstance._type.replace(/\./g, '/')}/${pageInstance._type}.njk.html`
    const context = {
      page: pageInstance
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
