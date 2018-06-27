const router = require('express').Router()
const {setContent} = require('@ministryofjustice/fb-nunjucks-helpers')
const {deepClone, FBLogger} = require('@ministryofjustice/fb-utils-node')
const jp = require('jsonpath')
const jsonschema = require('jsonschema')
const validator = new jsonschema.Validator()

const route = require('../route/route')
const {format} = require('../format/format')
const {evaluate} = require('../evaluate-condition')
const controlPath = require('../control-path/control-path')

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
      let page = deepClone(siteData[route])

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

      // const removeInstance = (data, path) => {
      // }

      // TODO: handle cases where conditional reveal is in effect
      const showNodes = jp.nodes(page, '$..[?(@.show)]').reverse()
      showNodes.forEach(showNode => {
        const show = evaluateInput(showNode.value.show)
        if (show === false) {
          const showPath = showNode.path
          const prop = showPath.pop()
          const parent = jp.query(page, jp.stringify(showPath))[0]
          if (Array.isArray(parent)) {
            parent.splice(prop, 1)
          } else {
            delete parent[prop]
          }
          FBLogger(`Removed ${showNode.value._id} instance since it should not be shown`)
        }
      })

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

        let hasErrors = false

        const registerError = (instance, errorType, error) => {
          if (error) {
            if (errorType === 'minimum' && error.schema.exclusiveMinimum) {
              errorType = 'exclusiveMinimum'
            } else if (errorType === 'maximum' && error.schema.exclusiveMaximum) {
              errorType = 'exclusiveMaximum'
            }
          }

          // Grab the error strings
          const errorStrings = siteData.errorStrings
          const errorHeaderStrings = siteData.errorHeaderStrings

          const instanceErrorStrings = instance.errors[errorType] || {}
          let {inline, summary} = instanceErrorStrings
          // TODO: handle composite errors
          // TODO: implement page header errors
          const args = Object.assign({control: instance.label || instance.legend}, instance.validation)
          let pageError = summary || errorHeaderStrings[`${errorType}.${instance._type}`] || errorHeaderStrings[errorType] || errorType
          pageError = format(pageError, args)
          page.errorList = page.errorList || []
          // TODO: make the href id robust - will fail for repeatable items on page
          page.errorList.push({
            html: pageError,
            href: `#${instance.id || instance._id}`
          })

          let instanceError = inline || errorStrings[`${errorType}.${instance._type}`] || errorStrings[errorType] || errorType
          instanceError = format(`${instanceError}`, args)
          instance.error = instanceError

          hasErrors = true
        }

        const normaliseValidation = (instance) => {
          instance.validation = instance.validation || {}
          instance.errors = instance.errors || {}
        }

        const getRequired = (instance, defaultValue = true) => {
          // TODO: fix checkbox specification
          if (instance._type === 'checkbox') {
            return false
          }
          let requiredCondition = instance.validation.required
          if (requiredCondition === undefined) {
            // TODO: fix checkboxes specification
            // const schemaValidation = schemas[instance._type].properties.validation
            // const defaultRequired = schemaValidation ? schemaValidation.properties.required
            // const defaultValue = defaultRequired ? defaultRequired['default'] : true
            requiredCondition = defaultValue
          }
          return evaluateInput(requiredCondition)
        }

        // ensure name instances have a validation property
        nameInstances.forEach(normaliseValidation)

        // perform required check
        nameInstances.forEach(nameInstance => {
          const required = getRequired(nameInstance)
          if (required) {
            let nameValue = getPath(nameInstance.name)
            if (typeof nameValue === 'string') {
              nameValue = nameValue.trim()
              if (!nameValue) {
                nameValue = undefined
              }
            }
            if (nameValue === undefined) {
              registerError(nameInstance, 'required')
            }
          }
        })

        const checkboxGroupInstances = jp.query(page, '$..[?(@._type === "checkboxes")]')
        checkboxGroupInstances.forEach(normaliseValidation)
        checkboxGroupInstances.forEach(checkboxGroupInstance => {
          // NB. this is a bug - checkboxes should not be required by default. Update specification accordingly
          const required = getRequired(checkboxGroupInstance, false)
          if (required) {
            const checkboxInstanceNames = checkboxGroupInstance.items.map(checkbox => checkbox.name).filter(name => name)
            let checked = false
            checkboxInstanceNames.forEach(name => {
              if (getPath(name)) {
                checked = true
              }
            })
            if (!checked) {
              registerError(checkboxGroupInstance, 'required')
            }
          }
        })

        // perform validation
        nameInstances.forEach(nameInstance => {
          if (nameInstance.error) {
            return
          }
          const validationLength = Object.keys(nameInstance.validation).length
          if (!validationLength) {
            return
          }
          if (validationLength === 1 && nameInstance.validation.required !== undefined) {
            return
          }
          // TODO: this needs to come from the specification
          // also would be good to use that info for storing the info as well
          nameInstance.validation.type = nameInstance._type === 'number' ? 'number' : 'text'

          let value = getPath(nameInstance.name)
          if (nameInstance._type === 'number') {
            const originalValue = value
            value = value * 1
            if (isNaN(value)) {
              value = originalValue
            }
          }
          // No value - don't validate
          // TODO: think through whether this is really sufficient
          if (value === '' || value === undefined) {
            return
          }
          let validationError = validator.validate(value, nameInstance.validation).errors[0]
          if (validationError) {
            registerError(nameInstance, validationError.name, validationError)
          }
        })

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
      nameInstances.forEach(nameInstance => {
        if (nameInstance.items) {
          nameInstance.items.forEach(item => {
            if (item.value === getPath(nameInstance.name)) {
              const chosen = item._type === 'option' ? 'selected' : 'checked'
              item[chosen] = true
            }
          })
        } else if (nameInstance.value) {
          if (nameInstance.value === getPath(nameInstance.name)) {
            nameInstance.checked = true
          }
        } else {
          if (getPath(nameInstance.name)) {
            nameInstance.value = getPath(nameInstance.name)
          }
        }
      })

      // TODO: do this based on info from the schemas
      // we know what types are in play
      // - find the properties of those schemas that need formatting
      // - and note whether they are multiline
      const contentProps = [
        'title',
        'heading',
        'body',
        'lede',
        'legend',
        'label',
        'hint'
      ]
      const inputData = getAll()
      contentProps.forEach(prop => {
        jp.apply(page, `$..${prop}`, (str) => {
          const options = {}
          if (prop === 'body') {
            options.multiline = true
          }
          if (typeof str !== 'string' && str.html) {
            str.html = format(str.html, inputData, options)
            return str
          }
          return format(str, inputData, options)
        })
      })

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
