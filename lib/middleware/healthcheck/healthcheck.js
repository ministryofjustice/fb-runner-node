require('@ministryofjustice/module-alias/register-module')(module)

const request = require('request-promise-native')
const {
  PORT,
  ROUTES: {
    healthcheck: HEALTHCHECK_URL
  }
} = require('~/fb-runner-node/constants/constants')

const TEST_URL = `http://localhost:${PORT}`

function init (validate) {
  return (req, res, next) => {
    if (req.originalUrl === HEALTHCHECK_URL) {
      return healthcheck(validate)
        .then(({ status, statusCode }) => {
          res.status(status ? 200 : 500)
          res.json({
            status,
            content: {
              statusCode
            }
          })
        })
    } else {
      return next()
    }
  }
}

function healthcheck (validate = () => true) {
  return request(TEST_URL)
    .then((response) => ({
      status: validate(response),
      statusCode: 200
    }))
    .catch(({ statusCode }) => ({
      status: false,
      statusCode
    }))
}

module.exports = {
  init,
  healthcheck
}
