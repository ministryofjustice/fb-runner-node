const test = require('tape')
const express = require('express')
const request = require('supertest')

const routesStatic = require('./routes-static')

const callRoutesStatic = (assetsUrlPrefix = '', paths = [], servicePath = __dirname) => {
  const app = express()
  app.use(routesStatic.init(assetsUrlPrefix, paths, servicePath))
  return app
}

// TODO: this should not be dealt with here, but by tests of actual forms
test.skip('When a file from govukfrontend is requested', t => {
  const app = callRoutesStatic()

  request(app)
    .get('/images/govuk-crest-2x.png')
    .end((err, res) => {
      t.equals(err, null, 'it should not invoke an error')
      t.equals(res.status, 200, 'it should return 200')
      t.equals(res.headers['content-type'], 'image/png', 'it should return the correct mime type')
      t.end()
    })
})
