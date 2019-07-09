const path = require('path')
const glob = require('glob')
const nunjucks = require('nunjucks')
const elementSizeMappings = require('../../element-size-mappings/element-size-mappings')
const fbNunjucksHelpers = require('@ministryofjustice/fb-nunjucks-helpers')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

let nunjucksAppEnv

const nunjucksConfiguration = (app, serviceDir, appDir, options = {}, components = []) => {
  const serviceNodeModules = path.join(serviceDir, 'node_modules')
  const govUkFrontEndPath = path.join(serviceNodeModules, 'govuk-frontend')
  const govukComponentsPath = path.join(govUkFrontEndPath, 'components')

  const appViews = []
  const macroPaths = []

  const addSearchPaths = (basePath) => {
    // TODO: integrate components style paths - eg. govuk-frontend
    if (basePath.endsWith('govuk-frontend')) {
      return
    }
    const templatesPath = path.join(basePath, 'templates', 'nunjucks')
    const specsPath = path.join(basePath, 'specifications')
    const viewsPath = path.join(basePath, 'views')

    appViews.push(templatesPath)
    appViews.push(specsPath)
    appViews.push(viewsPath)

    macroPaths.push(specsPath)
  }

  addSearchPaths(appDir)
  if (serviceDir) {
    addSearchPaths(serviceDir)
  }

  components.forEach(componentDir => {
    addSearchPaths(componentDir.sourcePath)
  })

  appViews.push(govukComponentsPath)
  appViews.push(govUkFrontEndPath)

  const nunjuckOptions = Object.assign({
    autoescape: true,
    express: app
  }, options)

  nunjucksAppEnv = nunjucks.configure(appViews, nunjuckOptions)

  const mappings = elementSizeMappings.getMappings()

  nunjucksAppEnv = fbNunjucksHelpers.init(nunjucksAppEnv, {mappings})
  macroPaths.forEach(macroPath => {
    const fbMacroPaths = glob.sync(`${macroPath}/**/*.njk`)
    nunjucksAppEnv.addMacros(fbMacroPaths)
  })
  const govukMacroPaths = glob.sync(`${govukComponentsPath}/**/macro.njk`)
  nunjucksAppEnv.addMacros(govukMacroPaths)

  return (req, res, next) => {
    res.locals.nunjucksAppEnv = nunjucksAppEnv
    res.nunjucksAppEnv = nunjucksAppEnv
    next()
  }
}

const sanitizeMatches = {
  id: / id="([^"]+)/g,
  for: / for="([^"]+)/g,
  'data-aria-controls': / data-aria-controls="([^"]+)/g
}
// ensure ids and data-aria-controls properties do not contain characters that would cause querySelector to choke
const sanitizeIdStyleProperty = (input, property) => {
  if (!input) {
    return input
  }
  return input.replace(sanitizeMatches[property], (m, m1) => {
    const updatedId = m1.replace(/(\[|\]|\.)/g, '_').replace(/_+/g, '_')
    return ` ${property}="${updatedId}`
  })
}

const getPageOutput = async (pageInstance, context = {}) => {
  const rendered = new Promise((resolve, reject) => {
    const templatePath = `${pageInstance._template || `${pageInstance._type.replace(/\./g, '/')}/template/nunjucks/${pageInstance._type}`}.njk.html`
    const page = deepClone(pageInstance)
    const renderContext = Object.assign({}, context, {page})
    nunjucksAppEnv.render(templatePath, renderContext, (err, output) => {
      if (err) {
      // TODO: log error not console.log(err)
      // console.log({templatePath, page})
        reject(err)
      }
      Object.keys(sanitizeMatches).forEach(property => {
        output = sanitizeIdStyleProperty(output, property)
      })

      resolve(output)
    })
  })
  return rendered
}
const renderPage = async (pageInstance, context) => {
  return getPageOutput(pageInstance, context)
}

const debugError = (err, next) => {
  const renderError = new Error(500)
  renderError.renderError = {
    heading: 'Nunjucks template render error',
    body: '',
    lede: err.message,
    components: [{
      _id: 'debug.error.details',
      _type: 'details',
      summary: 'Stack trace',
      html: `\`\`\`
${err.stack}
\`\`\``
    }]
  }

  if (next) {
    next(renderError)
  } else {
    throw renderError
  }
}

module.exports = {
  init: nunjucksConfiguration,
  renderPage,
  debugError
}
