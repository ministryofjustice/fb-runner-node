const test = require('tape')
const path = require('path')
const express = require('express')
const request = require('supertest')

const routesStatic = require('./routes-static')

const callRoutesStatic = ({assetsUrlPrefix = '', paths = [], serviceSources}) => {
  const app = express()
  app.use(routesStatic.init({assetsUrlPrefix, staticPaths: paths, serviceSources}))
  return app
}

const staticPath = path.resolve(__dirname, '..', 'spec')

test('When a file from an assets folder is requested', async t => {
  const serviceSources = [{
    sourcePath: path.resolve(staticPath, 'static', 'static-b')
  }]

  const app = callRoutesStatic({serviceSources})

  const {error, status, headers} = await request(app).get('/image-resource.png')
  t.equals(error, false, 'it should not invoke an error')
  t.equals(status, 200, 'it should return 200')
  t.equals(headers['content-type'], 'image/png', 'it should return the correct mime type')
  t.end()
})

test('When a specified node module does not have an assets folder', async t => {
  const serviceSources = [{
    sourcePath: path.resolve(staticPath, 'static', 'static-a')
  }]

  const app = callRoutesStatic({serviceSources})

  const {status: status1} = await request(app).get('/static.txt')
  t.equals(status1, 404, 'it should not serve assets at the root level')

  const {status: status2} = await request(app).get('/assets/static.txt')
  t.equals(status2, 404, 'it should not serve assets at any URL')
  t.end()
})

test('When an asset folder is present within another asset folder', async t => {
  const serviceSources = [{
    sourcePath: path.resolve(staticPath, 'static', 'static-b')
  }]

  const app = callRoutesStatic({serviceSources})

  const {status: statusNotFound} = await request(app).get('/image-resource-2.png')
  t.equals(statusNotFound, 404, 'it should not be found at the top level')

  const {status: statusFound} = await request(app).get('/assets/image-resource-2.png')
  t.equals(statusFound, 200, 'it should be found by specifying the nested asset folder')
  t.end()
})
