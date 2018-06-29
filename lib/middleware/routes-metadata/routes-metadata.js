const router = require('express').Router()
const {deepClone} = require('@ministryofjustice/fb-utils-node')
const jp = require('jsonpath')

const route = require('../../route/route')
const {evaluate} = require('../../evaluate-condition/evaluate-condition')
const controlPath = require('../../control-path/control-path')
const {
  validateInput,
  formatProperties,
  updateControlNames,
  skipComponents
} = require('../../page/page')

const metadataRouter = (siteData, schemas) => {
  // FBLogger({siteData, schemas})

  // Only handle actual routes
  // TODO: remove them based on actual pageness rather than relying on _type
  const pages = deepClone(siteData)
  Object.keys(pages).forEach(potentialPage => {
    if (!pages[potentialPage]._type.startsWith('page.')) {
      delete pages[potentialPage]
    }
  })

  // initialise route url matching and creation methods
  const pagesMethods = route.init(pages)

  // temporary next and previous page handling
  // TODO: implement proper next page method
  const startPage = siteData[pagesMethods.getData('/').route]
  const steps = startPage.steps
  steps.forEach((step, index) => {
    if (!index) {
      siteData[step].previouspage = startPage._id
    } else {
      siteData[step].previouspage = steps[index - 1]
    }
    if (index < steps.length - 1) {
      siteData[step].nextpage = steps[index + 1]
    }
  })
  startPage.nextpage = startPage.steps[0]

  router.use((req, res, next) => {
    const url = req._parsedUrl.pathname
    const handlerData = pagesMethods.getData(url)

    if (!handlerData) {
      next()
    } else {
      Object.assign(req.params, handlerData.params)
      const route = handlerData.route
      const page = deepClone(siteData[route])

      if (page.nextpage) {
        page.nextpage = pagesMethods.getUrl(page.nextpage) // siteData[page.nextpage].url
      }
      if (page.previouspage) {
        page.previouspage = pagesMethods.getUrl(page.previouspage) // siteData[page.previouspage].url
      }

      const {getAll, getPath, setPath, unsetPath} = req.user

      const evaluateInput = condition => {
        return evaluate(condition, {
          input: getAll()
        })
      }

      if (page.show !== undefined) {
        const showPage = evaluateInput(page.show)
        if (!showPage) {
          return res.redirect(page.nextpage)
        }
      }

      const POST = req.method === 'POST'
      // FBLogger({route, POST})

      // Remove unneeded components
      skipComponents(page, getAll())

      if (POST) {
        const nameInstances = jp.query(page, '$..[?(@.name)]')
        const names = nameInstances.map(nameInstance => nameInstance.name)
        names.forEach(name => {
          // TODO: handle composite values
          const nameValue = controlPath.get(req.body, name)
          if (nameValue !== undefined) {
            setPath(name, nameValue)
          } else {
            unsetPath(name)
          }
        })

        validateInput(page, siteData, getPath, evaluateInput)

        if (page.$validated) {
          return res.redirect(page.nextpage)
        }
      }

      // Update name values
      updateControlNames(page, getPath)

      // Format all the properties which need to be
      formatProperties(page, getAll())

      // TODO: remove setContent method from fb-nunjucks-helpers

      // TODO: make this unnecessary
      if (page._type.match(/(singlequestion|form)/)) {
        page._form = true
      }

      // TODO: shift this to correct place
      if (page._type === 'page.singlequestion') {
        const question = page.components[0]
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
      const templatePath = `${page._type.replace(/\./g, '/')}/${page._type}.njk.html`
      const context = {page}
      res.nunjucksAppEnv.render(templatePath, context, (err, output) => {
        if (err) {
          // TODO: log error not console.log(err)
          res.sendStatus(404)
          return
        }
        res.send(output)
      })
    }
  })
  return router
}

module.exports = {
  init: metadataRouter
}
