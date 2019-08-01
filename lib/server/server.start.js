const {FBLogger} = require('@ministryofjustice/fb-utils-node')

const startRunner = async (app, port, options = {}) => {
  // Fire up the app
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      FBLogger(`App is running on localhost:${port}`)
      if (options.callback) {
        options.callback(server, app)
      }
      resolve({server, app})
    })
  })
}

module.exports = startRunner
