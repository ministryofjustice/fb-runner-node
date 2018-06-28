const test = require('tape')
const express = require('express')
const request = require('supertest')
const path = require('path')

const routesCached = require('./routes-cached')

const callRoutesCached = (cacheDir) => {
  const app = express()
  app.use(routesCached.init(cacheDir))
  return app
}

const cacheDir = path.resolve(__dirname, '..', 'spec', 'static', 'static-a')

test('When routesCached is required ', t => {
  t.equal(typeof routesCached.init, 'function', 'it should export the init method')

  t.end()
})

test('When a cached file is requested', t => {
  t.plan(4)

  const app = callRoutesCached(cacheDir)

  request(app)
    .get('/foo')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error')
      t.equals(res.text, 'static-a foo', 'it should serve the file')
    })

  request(app)
    .get('/foo.html')
    .end((err, res) => {
      t.equals(err, null, 'it should invoke an error if requested with an .html extension')
      t.equals(res.text, 'static-a foo', 'it should serve the file')
    })
})

test('When a cached file is requested which does not have an .html extension', t => {
  t.plan(5)

  const app = callRoutesCached(cacheDir)

  request(app)
    .get('/bar')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error when called without extension')
      t.equals(res.status, 200, 'it should send a 200 (without extension)')
      t.equals(res.text, undefined, 'it should serve no content (without extension)') // this is what's observed, but is it an express-static bug?
    })

  request(app)
    .get('/bar.html')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error when called with extension')
      t.equals(res.status, 404, 'it should send a 404 (with extension)')
    })
})

test('When a cached index file is requested', t => {
  t.plan(6)

  const app = callRoutesCached(cacheDir)

  request(app)
    .get('/index.html')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error if requested with the .html extension')
      t.equals(res.text, 'static-a index.html', 'it should serve the file (with extension)')
    })

  request(app)
    .get('/index')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error if requested without the .html extension')
      t.equals(res.text, 'static-a index.html', 'it should serve the file (without extension')
    })

  request(app)
    .get('/')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error if requested as an implicit directory index')
      t.equals(res.text, 'static-a index.html', 'it should serve the file (index)')
    })
})

// test('When a url prefix is passed to routes-static', t => {
//   const app = callRoutesStatic('/url/prefix', [staticPath])

//   request(app)
//     .get('/url/prefix/static.txt')
//     .end((err, res) => {
//       t.equals(err, null, 'it should not invoke an error')
//       t.equals(res.text, 'static-a static.txt', 'it should use that prefix and serve the correct file')
//       t.end()
//     })
// })
