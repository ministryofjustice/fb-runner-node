const test = require('tape')
const express = require('express')
const request = require('supertest')
const path = require('path')

const routesStatic = require('./routes-static')

const callRoutesStatic = ({assetsUrlPrefix = '', paths = []}) => {
  const app = express()
  app.use(routesStatic.init({assetsUrlPrefix, staticPaths: paths}))
  return app
}

const staticPath = path.resolve(__dirname, '..', 'spec', 'static', 'static-a')

test('When a file that exists within a static route is requested', async t => {
  const app = callRoutesStatic({
    assetsUrlPrefix: '',
    paths: [staticPath]
  })
  const {error, text, status} = await request(app).get('/static.txt')
  t.equals(error, false, 'it should not invoke an error')
  t.equals(text, 'static-a static.txt', 'it should serve the file')
  t.equals(status, 200, 'it should return a successful status')
  t.end()
})

test('When a url prefix is passed to routes-static', async t => {
  const app = callRoutesStatic({
    assetsUrlPrefix: '/url/prefix',
    paths: [staticPath]
  })
  const {error, text} = await request(app).get('/url/prefix/static.txt')
  t.equals(error, false, 'it should not invoke an error')
  t.equals(text, 'static-a static.txt', 'it should use that prefix and serve the correct file')
  t.end()
})
