const {debugError} = require('../nunjucks-configuration/nunjucks-configuration')

const router = require('express').Router()
const {
  setService,
  formatProperties
} = require('../../page/page')

const nunjucksRouter = () => {
  router.use(/^\/([^.]+)$/, (req, res, next) => {
    let page = {
      _type: 'page.form',
      MODE: 'live'
    }
    const userData = req.user || {
      getUserData: () => ({}),
      getUserParams: () => ({})
    }
    page = setService(page, userData)
    page = formatProperties(page, userData)
    const context = {
      page
    }
    const view = req.params[0]
    const path = `${view}.njk.html`
    res.nunjucksAppEnv.render(path, Object.assign({}, res.locals, context), (err, output) => {
      if (err) {
        if (err.message.startsWith('template not found')) {
          return next(new Error(404))
        }
        return debugError(err, next)
      }
      return res.send(output)
    })
  })
  return router
}

module.exports = {
  init: nunjucksRouter
}
