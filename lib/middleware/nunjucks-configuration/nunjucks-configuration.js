const path = require('path')
const glob = require('glob')
const nunjucks = require('nunjucks')
const fbNunjucksHelpers = require('@ministryofjustice/fb-nunjucks-helpers')

// const govukClassname = require('./govuk-classname')

const nunjucksConfiguration = (app, appDir, kitDir, options = {}) => {
  const nodeModules = path.join(appDir, 'node_modules')

  const appViews = [
    path.join(appDir),
    path.join(appDir, 'app'),
    path.join(kitDir, 'app'),
    path.join(nodeModules, '@ministryofjustice', 'fb-runner-node'),
    path.join(nodeModules, '@ministryofjustice', 'fb-specification', 'specifications'),
    path.join(nodeModules, 'govuk-frontend', 'components'),
    path.join(nodeModules, 'govuk-frontend')
  ]
  const nunjuckOptions = Object.assign({
    autoescape: true,
    express: app
  }, options)

  let nunjucksAppEnv = nunjucks.configure(appViews, nunjuckOptions)

  const specsPath = path.join(nodeModules, '@ministryofjustice', 'fb-specification', 'specifications')
  const fbMacroPaths = glob.sync(`${specsPath}/**/*.njk`)

  const govukPath = path.join(nodeModules, 'govuk-frontend', 'components')
  const govukMacroPaths = glob.sync(`${govukPath}/**/macro.njk`)

  nunjucksAppEnv = fbNunjucksHelpers.init(nunjucksAppEnv)
  nunjucksAppEnv.addMacros(fbMacroPaths)
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
