const path = require('path')
const express = require('express')

const staticOptions = {
  index: false,
  immutable: true,
  maxAge: '28d'
}

const router = express.Router()
const serveStatic = (assetsUrlPrefix, staticPath) => {
  router.use(assetsUrlPrefix, express.static(staticPath, staticOptions))
}

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
    serveStatic(assetsUrlPrefix, staticPath)
  })

  let fbRunnerDir = ''
  if (nodeModules) {
    fbRunnerDir = path.join(nodeModules, '@ministryofjustice', 'fb-runner-node')
  }

  serveStatic(assetsUrlPrefix, path.resolve(fbRunnerDir, 'govuk-frontend-assets', 'assets'))
  serveStatic(assetsUrlPrefix, path.resolve(fbRunnerDir, 'govuk-frontend-assets'))
  serveStatic(assetsUrlPrefix, path.resolve(nodeModules, 'govuk-frontend', 'assets'))

  return router
}

module.exports = {
  init: routesStatic
}
