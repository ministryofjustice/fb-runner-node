const path = require('path')
const glob = require('glob')
const nunjucks = require('nunjucks')
const fbNunjucksHelpers = require('@ministryofjustice/fb-nunjucks-helpers')

// const govukClassname = require('./govuk-classname')

const nunjucksConfigure = (app, appDir, kitDir, options = {}) => {
  const appViews = [
    path.join(appDir),
    path.join(appDir, 'app'),
    path.join(kitDir, 'app'),
    path.join(appDir, 'node_modules', '@ministryofjustice', 'fb-specification', 'specifications'),
    path.join(appDir, 'node_modules', 'govuk-frontend', 'components'),
    path.join(appDir, 'node_modules', 'govuk-frontend')
  ]
  const nunjuckOptions = Object.assign({
    autoescape: true,
    express: app
  }, options)

  let nunjucksAppEnv = nunjucks.configure(appViews, nunjuckOptions)

  const nodeModules = path.resolve(__dirname, '..', 'node_modules')
  const specsPath = path.join(nodeModules, '@ministryofjustice', 'fb-specification', 'specifications')
  const fbMacroPaths = glob.sync(`${specsPath}/**/*.njk`)

  const govukPath = path.join(nodeModules, 'govuk-frontend', 'components')
  const govukMacroPaths = glob.sync(`${govukPath}/**/macro.njk`)

  nunjucksAppEnv = fbNunjucksHelpers.init(nunjucksAppEnv)
  nunjucksAppEnv.addMacros(fbMacroPaths)
  nunjucksAppEnv.addMacros(govukMacroPaths)

  return nunjucksAppEnv
}

module.exports = nunjucksConfigure
