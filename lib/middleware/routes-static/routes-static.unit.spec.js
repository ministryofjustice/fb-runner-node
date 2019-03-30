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

test('When routesStatic is required ', t => {
  t.equal(typeof routesStatic.init, 'function', 'it should export the init method')

  t.end()
})

test('When a file that exists within a static route is requested', t => {
  const app = callRoutesStatic('', [staticPath], __dirname)

  request(app)
    .get('/static.txt')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error')
      t.equals(res.text, 'static-a static.txt', 'it should serve the file')
      t.end()
    })
})

test('When a url prefix is passed to routes-static', t => {
  const app = callRoutesStatic('/url/prefix', [staticPath], __dirname)

  request(app)
    .get('/url/prefix/static.txt')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error')
      t.equals(res.text, 'static-a static.txt', 'it should use that prefix and serve the correct file')
      t.end()
    })
})
