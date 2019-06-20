
function useAsync (middleware) {
  return function wrappedRoute (req, res, next) {
    middleware(req, res)
      .then(() => {
        // Express does not set headersSent immediately
        process.nextTick(() => {
          if (!res.headersSent) {
            next()
          }
        })
      })
      .catch(err => {
        process.nextTick(() => {
          if (!res.headersSent) {
            next(err)
          }
        })
      })
  }
}

module.exports = useAsync
