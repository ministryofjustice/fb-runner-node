const test = require('tape')
const express = require('express')
const request = require('supertest')

const routesStatic = require('./routes-static')

const callRoutesStatic = ({assetsUrlPrefix = '', paths = []} = {}) => {
  const app = express()
  app.use(routesStatic.init({
    assetsUrlPrefix,
    staticPaths: paths
  }))
  return app
}

test('When a file that does not exist within a static route is requested', async t => {
  const app = callRoutesStatic()
  const {error, status} = await request(app).get('/static.txt')
  t.ok(error, null, 'it should invoke an error')
  t.equals(status, 404, 'it should return 404')
  t.end()
})
