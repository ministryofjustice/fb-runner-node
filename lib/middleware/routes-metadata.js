const router = require('express').Router()
const {setContent} = require('@ministryofjustice/fb-nunjucks-helpers')

const urls = {}
const pages = {}

const metadataRouter = (siteData) => {
  Object.keys(siteData).forEach(key => {
    const page = siteData[key]
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

  router.use((req, res, next) => {
    let path
    let context = {}

    const url = req.originalUrl
    if (urls[url]) {
      let page = Object.assign({}, urls[url])
      if (page.nextpage) {
        page.nextpage = pages[page.nextpage].url
      }
      if (page.previouspage) {
        page.previouspage = pages[page.previouspage].url
      }
      page = setContent(page, 'lede')
      page = setContent(page, 'body')
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
  return router
}

module.exports = metadataRouter
