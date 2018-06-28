const test = require('tape')

const locals = require('./locals')

const getLocalInstance = (options = {}) => {
  const localsInstance = locals.init('ENV', 'assetPath', 'env')
  const next = () => {}
  const req = {
    headers: {
      host: 'domain',
      'x-forwarded-proto': options['x-forwarded-proto']
    },
    protocol: 'http'
  }
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

  t.deepEquals(res.locals, {
    asset_path: '/assetPath/',
    env: 'env',
    ENV: 'ENV'
  }, 'it should set res.locals')

  t.equals(req.env, 'env', 'it should set req.env')
  t.equals(req.ENV, 'ENV', 'it should set req.ENV')

  t.equals(req.servername, 'http://domain', 'it should set req.servername')

  t.end()
})

test('When locals middleware is called and x-forwarded-proto header is set', t => {
  const {req} = getLocalInstance({
    'x-forwarded-proto': 'https'
  })

  t.equals(req.servername, 'https://domain', 'it should set req.servername')

  t.end()
})
