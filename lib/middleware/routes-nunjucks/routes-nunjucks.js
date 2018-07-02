const router = require('express').Router()

const nunjucksRouter = () => {
  router.use(/^\/([^.]+)$/, (req, res) => {
    let path
    let context = {}
    const view = req.params[0]
    path = `views/${view}.html`
    res.nunjucksAppEnv.render(path, context, (err, output) => {
      if (err) {
        // TODO: log error not console.log(err)
        res.sendStatus(404)
        return
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
