require('@ministryofjustice/module-alias/register-module')(module)

const debug = require('debug')
const error = debug('runner:error-handler')

const nunjucksConfiguration = require('~/fb-runner-node/middleware/nunjucks-configuration/nunjucks-configuration')
const serviceData = require('~/fb-runner-node/service-data/service-data')
const { getUserDataMethods } = require('~/fb-runner-node/middleware/user-data/user-data')
const {
  setService,
  formatProperties
} = require('~/fb-runner-node/page/page')

const errorHandler = (options = {}) => {
  const { GA_TRACKING_ID } = options
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
        error(e)
      }
    }
    external._fallbackError(req, res, statusCode)
  }

  external.handle = (e, req, res, next) => {
    error(e)

    if (e) {
      const message = `Error: ${req.originalUrl} - name: ${e.name} - message: ${e.message} - code: ${e.code}`
      if (req.logger) {
        req.logger.error({
          name: 'http_request_error',
          error: e,
          req
        }, message)
      } else {
        error(message, error.stack, error.stacktrace)
      }

      const code = e.message
      if (Number(code) === 401) {
        req.unauthorised = true
      }

      external.render(req, res, code, e.renderError)
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
