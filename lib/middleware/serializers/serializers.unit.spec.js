const test = require('tape')
const proxyquire = require('proxyquire')
const {stub} = require('sinon')

const uuid = require('uuid')
const uuidV4Stub = stub(uuid, 'v4')
uuidV4Stub.returns('12345')

const shorthash = require('shorthash')
const uniqueStub = stub(shorthash, 'unique')
uniqueStub.returns('cookieShortHashValue')

const {
  serializeRequest,
  serializeError
} = proxyquire('./serializers', {
  uuid,
  shorthash
})

test('When serializing a request object', t => {
  const req = {
    method: 'METHOD',
    url: '/url',
    headers: {
      'x-args': 'foo'
    },
    body: {
      foo: 'bodyfoo',
      bar: 'a',
      baz: ''
    },
    params: {
      foo: 'paramsfoo'
    },
    query: {
      foo: ['queryfoo1', 'queryfoo2']
    },
    data: '{"foo": "datafoo"}',
    httpVersion: 1.1,
    upgrade: true,
    additional_prop: 'should be discarded',
    another_prop: 'should also be discarded'
  }
  const serializedReq = serializeRequest(req)
  t.deepEqual(serializedReq, {
    method: 'METHOD',
    url: '/url',
    headers: {
      'x-args': 'foo'
    },
    httpVersion: 1.1,
    upgrade: true,
    body: {
      foo: '[REDACTED - string - 7 chars]',
      bar: '[REDACTED - string - 1 char]',
      baz: '[REDACTED - string - 0 chars]'
    },
    query: {
      foo: '[REDACTED - array: [0] - string - 9 chars; [1] - string - 9 chars]'
    },
    params: {
      foo: '[REDACTED - string - 9 chars]'
    },
    data: '{"foo":"[REDACTED - string - 7 chars]"}'
  }, 'it should serialize req objects correctly copying desired properties and dropping any others')

  t.end()
})

test('When serializing a request object with cookies', t => {
  const req = {
    headers: {
      cookie: 'foo=dsaidsaii; bar=dkmdskfksdfdf'
    }
  }
  const serializedReq = serializeRequest(req)
  t.deepEqual(serializedReq, {
    headers: {
      cookie: 'foo=cookieShortHashValue; bar=cookieShortHashValue'
    },
    cookie: {
      foo: 'cookieShortHashValue',
      bar: 'cookieShortHashValue'
    }
  }, 'it should redact the header cookies property and create shorthash values on the req object')

  t.end()
})

test('When calling the logger serializers', async t => {
  const error = {
    name: 'error.name',
    code: 'error.code',
    message: 'error.message',
    columnNumber: 'error.columnNumber',
    fileName: 'error.fileName',
    lineNumber: 'error.lineNumber',
    stack: 'error.stack',
    statusCode: 'error.statusCode',
    statusMessage: 'error.statusMessage',
    client_headers: 'error.client_headers',
    body: 'error.body',
    response: {
      body: {
        code: 403,
        message: 'Forbidden'
      },
      statusCode: 403,
      statusMessage: 'error.response.statusMessage',
      headers: 'error.response.headers',
      timings: 'error.response.timings'
    },
    additional_prop: 'should be discarded',
    another_prop: 'should also be discarded'
  }
  const serializedError = serializeError(error)
  t.deepEqual(serializedError, {
    name: 'error.name',
    code: 'error.code',
    message: 'error.message',
    columnNumber: 'error.columnNumber',
    fileName: 'error.fileName',
    lineNumber: 'error.lineNumber',
    stack: 'error.stack',
    statusCode: 'error.statusCode',
    statusMessage: 'error.statusMessage',
    client_headers: 'error.client_headers',
    body: 'error.body',
    response: {
      body: {
        code: 403,
        message: 'Forbidden'
      },
      statusCode: 403,
      statusMessage: 'error.response.statusMessage',
      headers: 'error.response.headers',
      timings: 'error.response.timings'
    }
  }, 'it should serialize error objects correctly copying desired properties and dropping any others')

  t.end()
})
