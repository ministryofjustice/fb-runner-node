require('module-alias/register')

const {FBLogger} = require('@ministryofjustice/fb-utils-node')
const nunjucksConfiguration = require('~/middleware/nunjucks-configuration/nunjucks-configuration')
const serviceData = require('~/service-data/service-data')
const {getUserDataMethods} = require('~/middleware/user-data/user-data')
const {
  setService,
  formatProperties
} = require('~/page/page')

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

  external.render = async (req, res, errCode, renderError) => {
    let statusCode = Number(errCode)
    if (isNaN(statusCode)) {
      statusCode = 500
    }
    res.status(statusCode)

    let errorInstance = serviceData.getInstance(`error.${errCode}`)

    if (!errorInstance) {
      errorInstance = serviceData.getInstance('error.500')
    }
    if (errorInstance) {
      if (renderError) {
        errorInstance = Object.assign(errorInstance, renderError)
      }
      const userData = req.user || getUserDataMethods({})
      errorInstance = setService(errorInstance, userData)
      errorInstance = formatProperties(errorInstance, userData)
      try {
        const output = await nunjucksConfiguration.renderPage(errorInstance, Object.assign({}, res.locals, {
          errCode,
          GA_TRACKING_ID
        }))
        res.send(output)
        return
      } catch (e) {
        // fall through to _fallbackError
      }
    }
    external._fallbackError(req, res, statusCode)
  }

  external.handle = (error, req, res, next) => {
    if (error) {
      const errMessage = `Error: ${req.originalUrl} - name: ${error.name} - message: ${error.message} - code: ${error.code}`
      if (req.logger) {
        req.logger.error({
          name: 'http_request_error',
          error,
          req
        }, errMessage)
      } else {
        FBLogger(errMessage, error.stack, error.stacktrace)
      }

      const errCode = error.message
      if (Number(errCode) === 401) {
        req.unauthorised = true
      }
      external.render(req, res, errCode, error.renderError)
    }
  }

  const compromisedRegex = /([ ,\\/\\.]|%20)+$/
  external.notFound = (req, res) => {
    // check that url has not been compromised by poor email formatting
    if (req.url.match(compromisedRegex)) {
      const redirect = req.url.replace(compromisedRegex, '')
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
