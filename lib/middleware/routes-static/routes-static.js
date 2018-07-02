const path = require('path')
const express = require('express')

const router = express.Router()
const routesStatic = (assetsUrlPrefix, staticPaths = []) => {
  let nodeModules = ''
  if (__dirname.match(/node_modules/)) {
    nodeModules = __dirname.replace(/(.+?node_modules).*/, '$1')
  }
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

  let fbRunnerDir = ''
  if (nodeModules) {
    fbRunnerDir = path.join(nodeModules, '@ministryofjustice', 'fb-runner-node')
  }
  router.use(assetsUrlPrefix, express.static(path.resolve(fbRunnerDir, 'govuk-frontend-assets', 'assets')))
  router.use(assetsUrlPrefix, express.static(path.resolve(fbRunnerDir, 'govuk-frontend-assets')))
  router.use(assetsUrlPrefix, express.static(path.resolve(nodeModules, 'govuk-frontend', 'assets')))

  return router
}

module.exports = {
  init: routesStatic
}
