const {FBLogger} = require('@ministryofjustice/fb-utils-node')
const nunjucksConfiguration = require('../nunjucks-configuration/nunjucks-configuration')
const serviceData = require('../../service-data/service-data')
const {
  setService,
  formatProperties
} = require('../../page/page')

const errorHandler = (options = {}) => {
  const {GA_TRACKING_ID} = options
  const external = {}

  external._fallbackError = (req, res, errCode = 500) => {
    if (errCode >= 500) {
      res.send(`We are currently experiencing difficulties (${errCode})`)
    } else {
      res.sendStatus(errCode)
    }
  }

  external.render = async (req, res, errCode) => {
    res.status(errCode)

    let errorInstance = serviceData.getInstance(`error.${errCode}`)
    if (!errorInstance && errCode !== 500) {
      errorInstance = serviceData.getInstance('error.500')
    }
    if (errorInstance) {
      const userData = req.user
      errorInstance = setService(errorInstance, userData)
      errorInstance = formatProperties(errorInstance, userData)
      try {
        const output = await nunjucksConfiguration.renderPage(errorInstance, {
          errCode,
          GA_TRACKING_ID
        })
        res.send(output)
        return
      } catch (e) {
        //
      }
    }
    external._fallbackError(req, res, errCode)
  }

  external.handle = (err, req, res, next) => {
    // if (res.headersSent) {
    //   return next(err)
    // }
    if (err) {
      FBLogger(`Error: ${req.originalUrl}`, `- name: ${err.name}`, `- message: ${err.message}`, `- code: ${err.code}`, err.stack, err.stacktrace)
      let errCode = Number(err.message.toString())
      if (isNaN(errCode)) {
        errCode = 500
      }
      if (errCode === 401) {
        req.unauthorised = true
      }
      external.render(req, res, errCode)
    }
  }

  const compromisedRegex = /([ ,\\/\\.]|%20)+$/
  external.notFound = (req, res) => {
    // check that url has not been compromised by poor email formatting
    if (req.url.match(compromisedRegex)) {
      let redirect = req.url.replace(compromisedRegex, '')
      res.redirect(redirect)
      return
    }
    external.render(req, res, 404)
  }

  return external
}

module.exports = {
  init: errorHandler
}
