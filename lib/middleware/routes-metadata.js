const router = require('express').Router()
const {deepClone} = require('@ministryofjustice/fb-utils-node')
const jp = require('jsonpath')

const route = require('../route/route')
const {format} = require('../format/format')
const {evaluate} = require('../evaluate-condition')
const controlPath = require('../control-path/control-path')
const validatePage = require('../validate-page/validate-page')
const formatProperties = require('../page/format-properties/format-properties')
const updateControlNames = require('../page/update-control-names/update-control-names')
const skipComponents = require('../page/skip-components/skip-components')

const metadataRouter = (siteData, schemas) => {
  // FBLogger({siteData, schemas})

  // remove non-routes
  // TODO: remove them based on actual type rather than relying on url property
  const pages = deepClone(siteData)
  Object.keys(pages).forEach(potentialPage => {
    if (!pages[potentialPage].url) {
      delete pages[potentialPage]
    }
  })

  // initialise route url matching and creation methods
  const pagesMethods = route.init(pages)

  // temporay next and previous page handling
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
    let path
    let context = {}

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

      const nameInstances = jp.query(page, '$..[?(@.name)]')
      const names = nameInstances.map(nameInstance => nameInstance.name)

      if (POST) {
        names.forEach(name => {
          // TODO: handle composite values
          const nameValue = controlPath.get(req.body, name)
          if (nameValue !== undefined) {
            setPath(name, nameValue)
          } else {
            unsetPath(name)
          }
        })

        let hasErrors = validatePage(page, siteData, getPath, evaluateInput)

        if (!hasErrors) {
          return res.redirect(page.nextpage)
        } else {
          const errorHeaderStrings = siteData.errorHeaderStrings
          let heading = errorHeaderStrings.heading
          heading = format(heading, {errorCount: page.errorList.length})
          page.errorTitle = heading
        }
      }

      // Update name values
      updateControlNames(page, getPath)

      // Format all the properties which need to be
      formatProperties(page, getAll())

      // TODO: remove setContent method
      // page = setContent(page, 'lede')
      // page = setContent(page, 'body')
      if (page._type.match(/(singlequestion|form)/)) {
        page._form = true
      }
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
      path = `${page._type.replace(/\./g, '/')}/${page._type}.njk.html`
      context = {page}

      res.nunjucksAppEnv.render(path, context, (err, output) => {
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

module.exports = metadataRouter
