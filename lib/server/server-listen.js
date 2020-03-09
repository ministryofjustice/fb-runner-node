const debug = require('debug')
const log = debug('runner:server-listen')
const error = debug('runner:server-listen')

const getErrorMessage = ({ message = 'No error message defined' }) => message

module.exports = async function listenServer (app, options = {}) {
  const {
    PORT,
    callback
  } = options

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, (e) => {
      log(`Runner is listening on port ${PORT}`)

      /*
       *  Problematic
       */
      if (callback) callback(e, { server, app })

      if (e) {
        error(getErrorMessage(e))

        reject(e)
      } else {
        log('Ready')

        resolve({ server, app })
      }
    })
  })
}
