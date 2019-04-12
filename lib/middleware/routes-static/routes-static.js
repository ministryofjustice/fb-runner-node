const path = require('path')
const express = require('express')
const { stat } = require('fs').promises

const staticOptions = {
  index: false,
  immutable: true,
  maxAge: '28d'
}

async function locateAssetFolders(componentDirs) {
  const possibleAssetFolders = componentDirs.map(({sourcePath}) => {
    return path.resolve(sourcePath, 'assets')
  })

  const assetFolders = possibleAssetFolders.filter(async (folder) => {
    let isDirectory;

    try {
      isDirectory = (await stat(folder)).isDirectory()
    } catch (err) {
      // Don't serve asset folders which do not exist
    }

    return isDirectory;
  })

  return Promise.all(assetFolders)
}

const router = express.Router()
const serveStatic = (assetsUrlPrefix, staticPath) => {
  router.use(assetsUrlPrefix, express.static(staticPath, staticOptions))
}

async function routesStatic(options = {}) {
  const {
    assetsUrlPrefix,
    staticPaths = [],
    serviceDir,
    componentDirs = []
  } = options

  staticPaths.forEach(staticPath => {
    // TODO: add ability to pass an explicit url prefix { urlPrefix: '/foo', dir}
    serveStatic(assetsUrlPrefix, staticPath)
  })

  if (componentDirs.length) {
    for (let directory of await locateAssetFolders(componentDirs)) {
      serveStatic(assetsUrlPrefix, directory)
    }
  }

  // TODO: Why are we serving this folder?
  let nodeModulesPath = path.join(serviceDir, 'node_modules')
  serveStatic(assetsUrlPrefix, path.resolve(nodeModulesPath, 'govuk-frontend'))

  return router
}

module.exports = {
  init: routesStatic
}
