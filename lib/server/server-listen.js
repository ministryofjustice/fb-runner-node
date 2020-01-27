const debug = require('debug')
const log = debug('runner:server-listen')
const error = debug('runner:server-listen')

debug.enable('runner:*')

module.exports = async function listenServer (app, options = {}) {
  const {
    PORT,
    callback
  } = options

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, (e) => {
      log(`App is running on http://localhost:${PORT}`)

      /*
       *  Problematic
       */
      if (callback) callback(e, { server, app })

      if (e) {
        error(e)

        reject(e)
      } else {
        log('Ready')

        resolve({ server, app })
      }
    })
  })
}
