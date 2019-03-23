const router = require('express').Router()

const nunjucksRouter = () => {
  router.use(/^\/([^.]+)$/, (req, res, next) => {
    let path
    let context = {}
    const view = req.params[0]
    path = `${view}.html`
    res.nunjucksAppEnv.render(path, Object.assign({}, res.locals, context), (err, output) => {
      if (err) {
        return next(new Error(404))
      }
      res.send(output)
    })
    // const context = {}
    // res.render(path, context, function (err, html) {
    //   if (err) {
    //     console.log(err)
    //     res.render(path + '/index', context, function (err2, html) {
    //       if (err2) {
    //         next()
    //       } else {
    //         res.send(html)
    //       }
    //     })
    //   } else {
    //     res.send(html)
    //   }
    // })
  })
  return router
}

module.exports = {
  init: nunjucksRouter
}
