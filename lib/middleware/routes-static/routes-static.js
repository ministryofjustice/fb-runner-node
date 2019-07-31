const path = require('path')
const {statSync} = require('fs')
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

function init (options = {}) {
  const {
    assetsUrlPrefix,
    staticPaths = [],
    componentDirs = []
  } = options

  staticPaths.forEach(staticPath => {
    // TODO: add ability to pass an explicit url prefix { urlPrefix: '/foo', dir}
    serveStatic(assetsUrlPrefix, staticPath)
  })

  const possibleAssetFolders = componentDirs.map(({sourcePath}) => {
    return path.resolve(sourcePath, 'assets')
  }).concat(componentDirs.map(({sourcePath}) => {
    return path.resolve(sourcePath, 'govuk', 'assets')
  }))

  for (const resource of possibleAssetFolders) {
    console.log({resource})
    let isDirectory

    try {
      const resourceDetails = statSync(resource)
      isDirectory = resourceDetails.isDirectory()
    } catch (err) {
      // Don't serve this folder as it doesn't exist
    }

    if (isDirectory) {
      serveStatic(assetsUrlPrefix, resource)
    }
  }

  return router
}

module.exports = {
  init
}
