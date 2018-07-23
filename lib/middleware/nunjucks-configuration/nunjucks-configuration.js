const path = require('path')
const glob = require('glob')
const nunjucks = require('nunjucks')
const fbNunjucksHelpers = require('@ministryofjustice/fb-nunjucks-helpers')

const nunjucksConfiguration = (app, serviceDir, appDir, options = {}, schemaObjs = []) => {
  const nodeModules = path.join(appDir, 'node_modules')
  const govUkFrontEndPath = path.join(nodeModules, 'govuk-frontend')
  const govukComponentsPath = path.join(govUkFrontEndPath, 'components')

  const appViews = []
  const macroPaths = []

  const addSearchPaths = (basePath) => {
    const templatesPath = path.join(basePath, 'templates', 'nunjucks')
    const specsPath = path.join(basePath, 'specifications')

    appViews.push(templatesPath)
    appViews.push(specsPath)

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

  let nunjucksAppEnv = nunjucks.configure(appViews, nunjuckOptions)

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

module.exports = {
  init: nunjucksConfiguration
}
