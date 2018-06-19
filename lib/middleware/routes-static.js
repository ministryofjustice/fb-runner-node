const path = require('path')
const express = require('express')

const router = express.Router()
const routesStatic = (assetsUrlPrefix, staticPaths = []) => {
  // TODO: MOVE TO PRE-STATIC
  // router.use('/public/downloads/*.pdf', (req, res, next) => {
  //   const pdfPath = req.url.replace(/.*\//, '')
  //   res.set({
  //     'Content-Type': 'application/pdf',
  //     'Access-Control-Allow-Origin': '*',
  //     'Content-Disposition': `attachment; filename=${pdfPath}`
  //   })
  //   next()
  // }) appdir/assetpath appdir/assets  appdir/app/assets  kitdir/app/assets
  staticPaths.forEach(staticPath => {
    // TODO: add ability to pass an explicit url prefix { urlPrefix: '/foo', dir}
    router.use(assetsUrlPrefix, express.static(staticPath))
  })
  router.use(assetsUrlPrefix, express.static(path.resolve('govuk-frontend-assets', 'assets')))
  router.use(assetsUrlPrefix, express.static(path.resolve('govuk-frontend-assets')))
  router.use(assetsUrlPrefix, express.static(path.resolve('node_modules', 'govuk-frontend', 'assets')))

  return router
}

module.exports = routesStatic
