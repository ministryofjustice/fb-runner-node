function useAsync (middleware) {
  return function wrappedRoute (req, res, next) {
    const callNext = (err) => {
      process.nextTick(() => {
        if (!res.headersSent) {
          next(err)
        }
      })
    }

    middleware(req, res)
      .then(() => { callNext() })
      .catch((err) => { callNext(err) })
  }
}

module.exports = useAsync
