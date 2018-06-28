const test = require('tape')
const express = require('express')
const request = require('supertest')
const path = require('path')

const routesStatic = require('./routes-static')

const callRoutesStatic = (assetsUrlPrefix = '', paths = []) => {
  const app = express()
  app.use(routesStatic.init(assetsUrlPrefix, paths))
  return app
}

const staticPath = path.resolve(__dirname, '..', 'spec', 'static', 'static-a')

test('When a file that exists within a static route is requested', t => {
  const app = callRoutesStatic('', [staticPath])

  request(app)
    .get('/static.txt')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error')
      t.equals(res.text, 'static-a static.txt', 'it should serve the file')
      t.end()
    })
})

test('When a url prefix is passed to routes-static', t => {
  const app = callRoutesStatic('/url/prefix', [staticPath])

  request(app)
    .get('/url/prefix/static.txt')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error')
      t.equals(res.text, 'static-a static.txt', 'it should use that prefix and serve the correct file')
      t.end()
    })
})
