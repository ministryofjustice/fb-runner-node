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

const routesStatic = (assetsUrlPrefix, staticPaths = [], serviceDir) => {
  staticPaths.forEach(staticPath => {
    // TODO: add ability to pass an explicit url prefix { urlPrefix: '/foo', dir}
    serveStatic(assetsUrlPrefix, staticPath)
  })

  let nodeModules = path.join(serviceDir, 'node_modules')

  serveStatic(assetsUrlPrefix, path.resolve(nodeModules, '@ministryofjustice', 'fb-components-core', 'assets'))
  serveStatic(assetsUrlPrefix, path.resolve(nodeModules, 'govuk-frontend', 'assets'))
  serveStatic(assetsUrlPrefix, path.resolve(nodeModules, 'govuk-frontend'))

  return router
}

module.exports = {
  init: routesStatic
}
