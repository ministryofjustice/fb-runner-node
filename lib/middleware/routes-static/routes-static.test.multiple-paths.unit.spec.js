const test = require('tape')
const express = require('express')
const request = require('supertest')
const path = require('path')

const routesStatic = require('./routes-static')

const callRoutesStatic = (assetsUrlPrefix = '', paths = [], servicePath) => {
  const app = express()
  app.use(routesStatic.init(assetsUrlPrefix, paths, servicePath))
  return app
}

const staticPath = path.resolve(__dirname, '..', 'spec', 'static', 'static-a')
const staticPathB = path.resolve(__dirname, '..', 'spec', 'static', 'static-b')

test('When a file that exists within more than one static route is requested', t => {
  const app = callRoutesStatic('', [staticPathB, staticPath], __dirname)

  request(app)
    .get('/static.txt')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error')
      t.equals(res.text, 'static-b static.txt', 'it should serve the correct file')
      t.end()
    })
})
