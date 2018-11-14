const path = require('path')
const glob = require('glob')
const nunjucks = require('nunjucks')
const fbNunjucksHelpers = require('@ministryofjustice/fb-nunjucks-helpers')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

let nunjucksAppEnv

const nunjucksConfiguration = (app, serviceDir, appDir, options = {}, schemaObjs = []) => {
  const nodeModules = path.join(appDir, 'node_modules')
  const govUkFrontEndPath = path.join(nodeModules, 'govuk-frontend')
  const govukComponentsPath = path.join(govUkFrontEndPath, 'components')

  const appViews = []
  const macroPaths = []

  const addSearchPaths = (basePath) => {
    const templatesPath = path.join(basePath, 'templates', 'nunjucks')
    const specsPath = path.join(basePath, 'specifications')
    const viewsPath = path.join(basePath, 'views')

    appViews.push(templatesPath)
    appViews.push(specsPath)
    appViews.push(viewsPath)

    macroPaths.push(specsPath)
  }

  if (serviceDir) {
    addSearchPaths(serviceDir)
  }
  addSearchPaths(appDir)

  schemaObjs.forEach(schemaObj => {
    addSearchPaths(schemaObj.path)
  })

  appViews.push(govukComponentsPath)
  appViews.push(govUkFrontEndPath)

  const nunjuckOptions = Object.assign({
    autoescape: true,
    express: app
  }, options)

  nunjucksAppEnv = nunjucks.configure(appViews, nunjuckOptions)

  nunjucksAppEnv = fbNunjucksHelpers.init(nunjucksAppEnv)
  // macroPaths.push(govukComponentsPath)
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
      resolve(output)
      // res.send(output)
    })
  })
  return rendered
}
const renderPage = async (pageInstance, context) => {
  return getPageOutput(pageInstance, context)
}

module.exports = {
  init: nunjucksConfiguration,
  renderPage
}
