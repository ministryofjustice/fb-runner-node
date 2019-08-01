const {FBLogger} = require('@ministryofjustice/fb-utils-node')

const startRunner = async (app, options = {}) => {
  const {
    PORT,
    callback
  } = options
  // Fire up the app
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, (err) => {
      FBLogger(`App is running on localhost:${PORT}`)
      if (callback) {
        return callback(err, {server, app})
      }
      if (err) {
        reject(err)
      } else {
        resolve({server, app})
      }
    })
  })
}

module.exports = startRunner
