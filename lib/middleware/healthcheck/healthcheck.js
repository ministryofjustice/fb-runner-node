require('@ministryofjustice/module-alias/register-module')(module)

const request = require('request-promise-native')
const {
  PORT
} = require('~/fb-runner-node/constants/constants')

const TEST_URL = `http://localhost:${PORT}`

function init (validate = () => true) {
  return (req, res) => (
    request(TEST_URL)
      .then((response) => ({
        status: validate(response),
        statusCode: 200
      }))
      .catch(({ statusCode }) => ({
        status: false,
        statusCode
      }))
      .then(({ status, statusCode }) => {
        res.status(status ? 200 : 500)
        res.json({
          status,
          content: {
            statusCode
          }
        })
      })
  )
}

module.exports = {
  init
}
