const path = require('path')
const glob = require('glob')
const {
  existsSync,
  readFileSync,
  writeFileSync
} = require('fs')
const nunjucks = require('nunjucks')
const elementSizeMappings = require('../../element-size-mappings/element-size-mappings')
const fbNunjucksHelpers = require('@ministryofjustice/fb-nunjucks-helpers')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

let nunjucksAppEnv

const nunjucksConfiguration = (app, options = {}, components = []) => {
  components = deepClone(components)

  // Patch govukHint to allow block-level elements
  const govUkOption = components.filter(item => item.source === 'govuk-frontend')[0] || {}
  const govUkFrontEndPath = govUkOption.sourcePath
  const govukComponentsPath = govUkFrontEndPath ? path.join(govUkFrontEndPath, 'components') : undefined
  if (govukComponentsPath) {
    const hintTemplatePath = path.join(govukComponentsPath, 'hint', 'template.njk')
    if (existsSync(hintTemplatePath)) {
      let hintTemplate = readFileSync(hintTemplatePath).toString()
      hintTemplate = hintTemplate.replace(/(<\/*)span/g, '$1div')
      writeFileSync(hintTemplatePath, hintTemplate)
    }
  }

  components = components.map(component => component.sourcePath)

  // paths for Nunjucks to search for components/templates
  const appViews = []

  const addSearchPath = (basePath, ...searchPath) => {
    const actualPath = path.join(basePath, ...searchPath)
    if (existsSync(actualPath)) {
      appViews.push(actualPath)
    }
  }
  const addSearchPaths = (basePath) => {
    // fb locations
    addSearchPath(basePath, 'templates', 'nunjucks')
    addSearchPath(basePath, 'specifications')
    addSearchPath(basePath, 'views')

    // govuk-frontend style locations
    addSearchPath(basePath, 'components')
    // top level templates at top level of directory hierarchy eg. template.njk
    const hasTopLevelNjk = glob.sync(`${basePath}/*.njk`).length
    if (hasTopLevelNjk) {
      addSearchPath(basePath)
    }
  }

  // Reverse component path order as first matched wins
  components.reverse().forEach(component => {
    addSearchPaths(component)
  })

  // Initializer Nunjucks
  const nunjuckOptions = Object.assign({
    autoescape: true,
    express: app
  }, options)
  nunjucksAppEnv = nunjucks.configure(appViews, nunjuckOptions)

  // Initialize FB Nunjucks Helpers
  const mappings = elementSizeMappings.getMappings()
  nunjucksAppEnv = fbNunjucksHelpers.init(nunjucksAppEnv, {mappings})

  // Add macros
  const addMacros = (basePath) => {
    const specsPath = path.join(basePath, 'specifications')
    const metadataPath = path.join(basePath, 'metadata')
    const viewsPath = path.join(basePath, 'views')
    // FB module  or govuk-frontend style?
    // - Form Builder uses the macro name for the file name
    // - govuk-frontend uses macro.njk (which in turn includes template.njk) for all its macros
    const fbStyle = existsSync(specsPath) || existsSync(metadataPath) || existsSync(viewsPath)
    const macrosGlob = fbStyle ? `${specsPath}/**/*.njk` : `${basePath}/**/macro.njk`
    const macroPaths = glob.sync(macrosGlob)
    nunjucksAppEnv.addMacros(macroPaths)
  }

  // Use component path order as is so later decalrations can trump earlier ones
  components.forEach(component => {
    addMacros(component)
  })

  return (req, res, next) => {
    res.locals.nunjucksAppEnv = nunjucksAppEnv
    res.nunjucksAppEnv = nunjucksAppEnv
    next()
  }
}

const sanitizeMatches = {
  id: / id="([^"]+)/g,
  for: / for="([^"]+)/g,
  'data-aria-controls': / data-aria-controls="([^"]+)/g,
  'aria-describedby': / aria-describedby="([^"]+)/g
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
