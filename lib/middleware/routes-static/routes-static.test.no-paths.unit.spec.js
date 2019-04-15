const test = require('tape')
const express = require('express')
const request = require('supertest')

const routesStatic = require('./routes-static')

const callRoutesStatic = (assetsUrlPrefix = '', paths = [], servicePath = __dirname) => {
  const app = express()
  app.use(routesStatic.init(assetsUrlPrefix, paths, servicePath))
  return app
}

test('When a file that does not exist within a static route is requested', t => {
  const app = callRoutesStatic()

  request(app)
    .get('/static.txt')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error')
      t.equals(res.status, 404, 'it should return 404')
      t.end()
    })
})
