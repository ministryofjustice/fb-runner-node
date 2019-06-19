const test = require('tape')
const express = require('express')
const request = require('supertest')
const path = require('path')

const routesStatic = require('./routes-static')

const callRoutesStatic = ({assetsUrlPrefix = '', paths = []}) => {
  const app = express()
  app.use(routesStatic.init({
    assetsUrlPrefix,
    staticPaths: paths
  }))
  return app
}

const staticPath = path.resolve(__dirname, '..', 'spec', 'static', 'static-a')
const staticPathB = path.resolve(__dirname, '..', 'spec', 'static', 'static-b')

test('When a file that exists within more than one static route is requested', async t => {
  const app = callRoutesStatic({
    assetsUrlPrefix: '',
    paths: [staticPathB, staticPath]
  })

  const {error, text} = await request(app).get('/static.txt')
  t.equals(error, false, 'it should not invoke an error')
  t.equals(text, 'static-b static.txt', 'it should serve the correct file')
  t.end()
})
