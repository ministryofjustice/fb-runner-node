const router = require('express').Router()

const testJourney = require('../spec/journey.json')
const urls = {}
const pages = {}
testJourney.forEach(page => {
  urls[page.url] = page
  pages[page._id] = page
})
const startPage = urls['/']
const steps = startPage.steps
steps.forEach((step, index) => {
  if (!index) {
    pages[step].previouspage = startPage._id
  } else {
    pages[step].previouspage = steps[index - 1]
  }
  if (index < steps.length - 1) {
    pages[step].nextpage = steps[index + 1]
  }
})
startPage.nextpage = startPage.steps[0]

const nunjucksRouter = () => {
  router.use((req, res, next) => {
    let path
    let context = {}

    const url = req.originalUrl
    if (urls[url]) {
      const page = Object.assign({}, urls[url])
      if (page.nextpage) {
        page.nextpage = pages[page.nextpage].url
      }
      if (page.previouspage) {
        page.previouspage = pages[page.previouspage].url
      }
      if (page._type.match(/(singlequestion|form)/)) {
        page._form = true
      }
      if (page._type === 'page.singlequestion') {
        const question = page.components[0]
        if (typeof question.label === 'string') {
          question.label = {
            html: question.label
          }
        }
        question.label.isPageHeading = true
        question.label.classes = 'govuk-fieldset__legend--l govuk-label--l'
      }
      path = `${page._type.replace(/\./g, '/')}/${page._type}.njk.html`
      context = {page}

      res.nunjucksAppEnv.render(path, context, (err, output) => {
        if (err) {
          // TODO: log error not console.log(err)
          res.sendStatus(404)
          return
        }
        res.send(output)
      })
    } else {
      next()
    }
  })

  router.use(/^\/([^.]+)$/, (req, res, next) => {
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

module.exports = nunjucksRouter
