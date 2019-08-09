const path = require('path')
const {statSync, existsSync} = require('fs')
const express = require('express')

const staticOptions = {
  index: false,
  immutable: true,
  maxAge: '28d'
}

const router = express.Router()
const serveStatic = (assetsUrlPrefix, staticPath) => {
  if (!existsSync(staticPath)) {
    return
  }
  const staticPathDetails = statSync(staticPath)
  const isDirectory = staticPathDetails.isDirectory()
  if (isDirectory) {
    router.use(assetsUrlPrefix, express.static(staticPath, staticOptions))
  }
}

function init (options = {}) {
  const {
    assetsUrlPrefix,
    staticPaths = [],
    serviceSources = []
  } = options

  staticPaths.forEach(staticPath => {
    // TODO: add ability to pass an explicit url prefix { urlPrefix: '/foo', dir}
    serveStatic(assetsUrlPrefix, staticPath)
  })

  const possibleAssetFolders = serviceSources.map(({sourcePath}) => {
    return path.resolve(sourcePath, 'assets')
  })

  for (const resource of possibleAssetFolders) {
    serveStatic(assetsUrlPrefix, resource)
  }

  return router
}

module.exports = {
  init
}
