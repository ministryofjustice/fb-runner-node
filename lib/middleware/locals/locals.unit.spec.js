const test = require('tape')

const locals = require('./locals')

const {getMocks} = require('../../spec/mock-express-middleware')

const getLocalInstance = (options = {}) => {
  const localsInstance = locals.init({}, {
    ENVIRONMENT_DISPLAY: 'foo'
  }, 'assetPath', {
    govuk_frontend_version: '1.4.5'
  })
  const next = () => {}
  const {req} = getMocks({
    req: {
      headers: {
        host: 'domain',
        'x-forwarded-proto': options['x-forwarded-proto']
      },
      protocol: 'http'
    }
  })
  const res = {locals: {}}
  localsInstance(req, res, next)
  return {req, res}
}

test('When locals is required ', t => {
  t.equal(typeof locals.init, 'function', 'it should export the init method')

  t.end()
})

test('When locals middleware is called', t => {
  const {req, res} = getLocalInstance()

  t.deepEqual(res.locals, {
    asset_path: '/assetPath/',
    env: {
      ENVIRONMENT_DISPLAY: 'foo'
    },
    ENV: {},
    environmentDisplay: 'foo',
    govuk_frontend_version: '1.4.5'
  }, 'it should set res.locals')

  t.deepEqual(req.env, {
    ENVIRONMENT_DISPLAY: 'foo'
  }, 'it should set req.env')
  t.deepEqual(req.ENV, {}, 'it should set req.ENV')

  t.equal(req.servername, 'http://domain', 'it should set req.servername')

  t.end()
})

test('When locals middleware is called and x-forwarded-proto header is set', t => {
  const {req} = getLocalInstance({
    'x-forwarded-proto': 'https'
  })

  t.equals(req.servername, 'https://domain', 'it should set req.servername')

  t.end()
})
