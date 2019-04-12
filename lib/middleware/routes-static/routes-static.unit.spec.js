const test = require('tap').test
const express = require('express')
const request = require('supertest')
const path = require('path')

const routesStatic = require('./routes-static')

const callRoutesStatic = async ({assetsUrlPrefix = '', paths = [], serviceDir = __dirname}) => {
  const app = express()
  app.use(await routesStatic.init({assetsUrlPrefix, staticPaths: paths, serviceDir}))
  return app
}

const staticPath = path.resolve(__dirname, '..', 'spec', 'static', 'static-a')

test('When a file that exists within a static route is requested', async t => {
  const app = await callRoutesStatic({
    assetsUrlPrefix: '',
    paths: [staticPath]
  })
  const {error, text, status} = await request(app).get('/static.txt')
  t.equals(error, false, 'it should not invoke an error')
  t.equals(text, 'static-a static.txt', 'it should serve the file')
})

test('When a url prefix is passed to routes-static', async t => {
  const app = await callRoutesStatic({
    assetsUrlPrefix: '/url/prefix',
    paths: [staticPath]
  })
  const {error, text} = await request(app).get('/url/prefix/static.txt')
  t.equals(error, false, 'it should not invoke an error')
  t.equals(text, 'static-a static.txt', 'it should use that prefix and serve the correct file')
})
