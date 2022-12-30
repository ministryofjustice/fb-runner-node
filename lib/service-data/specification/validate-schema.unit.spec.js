const {
  test
} = require('tap')
const sinon = require('sinon')
const path = require('path')
const glob = require('glob-promise')
const proxyquire = require('proxyquire')

const debugStub = sinon.stub()
const logStub = sinon.stub()
const errorStub = sinon.stub()

debugStub.onCall(0).returns(logStub)
debugStub.onCall(1).returns(errorStub)

const validateSchema = proxyquire('./validate-schema', { debug: debugStub })

const specs = [{
  path: path.resolve('./data/service-data/specification/specs-a'),
  $idRoot: 'http://gov.uk/schema/v1.0.0'
}]

const validFiles = glob.sync(path.resolve('./data/service-data/specification/specs-a/specifications/definition/data/data/valid/*.json'))
const invalidFiles = glob.sync(path.resolve('./data/service-data/specification/specs-a/specifications/definition/data/data/invalid/**.json'))

function transformPath (accumulator, current) {
  current.path = current.path.replace(/.*\/data\/service-data\/specification\/specs-a/, '/data/specs-a')

  return accumulator.concat(current)
}

function transformPaths ({ valid, invalid, ...result }) {
  return {
    ...Array.isArray(valid) ? { valid: valid.reduce(transformPath, []) } : {},
    ...Array.isArray(invalid) ? { invalid: invalid.reduce(transformPath, []) } : {}
  }
}

test('Validating the default valid and invalid files against a schema', async (t) => {
  debugStub.reset()
  logStub.reset()
  errorStub.reset()

  t.equal(await validateSchema('definition.data', { specs }), undefined, 'returns undefined when there are no errors')

  t.end()
})

test('Validating valid files explicitly against a schema', async (t) => {
  debugStub.reset()
  logStub.reset()
  errorStub.reset()

  t.equal(await validateSchema('definition.data', { specs, valid: validFiles }), undefined, 'returns undefined when there are no errors')
  t.ok(logStub.notCalled, 'does not log any warnings')

  t.end()
})

test('Validating valid files explicitly against a schema but asking to warn about missing test files', async (t) => {
  debugStub.reset()
  logStub.reset()
  errorStub.reset()

  t.equal(await validateSchema('definition.data', { specs, warn: true, valid: validFiles }), undefined, 'returns undefined when there are no errors')
  t.ok(logStub.calledWith('Valid JSON not found for Schema "definition.data"'), 'warns that valid JSON can\'t be found')

  t.end()
})

test('Validating invalid files explicitly against a schema', async (t) => {
  debugStub.reset()
  logStub.reset()
  errorStub.reset()

  t.equal(await validateSchema('definition.data', { specs, invalid: invalidFiles }), undefined, 'returns undefined when there are no errors')
  t.ok(logStub.notCalled, 'does not log any warnings')

  t.end()
})

test('Validating invalid files explicitly against a schema but asking to warn about missing test files', async (t) => {
  debugStub.reset()
  logStub.reset()
  errorStub.reset()

  const result = await validateSchema('definition.data', { specs, warn: true, invalid: invalidFiles })

  t.equal(result, undefined, 'returns undefined when there are no errors')
  t.ok(logStub.calledWith('Valid JSON not found for Schema "definition.data"'), 'warns that valid JSON can\'t be found')

  t.end()
})

test('Validating files that are expected to be valid against a schema but which are not', async (t) => {
  debugStub.reset()
  logStub.reset()
  errorStub.reset()

  const result = await validateSchema('definition.data', { specs, valid: invalidFiles })
  const expected = require(path.join(path.resolve('./data/service-data/specification/expected/specs-expected-valid.json')))
  const {
    valid: [
      first,
      second,
      third
    ]
  } = result

  const sourcePath = 'data/service-data/specification/specs-a/specifications/definition/data/data/invalid'

  t.ok(first.path.includes(`${sourcePath}/definition.data.invalid._id.json`), 'returns the path for `definition.data.invalid._id.json`')
  t.ok(second.path.includes(`${sourcePath}/definition.data.invalid._type.json`), 'returns the path for `definition.data.invalid._type.json`')
  t.ok(third.path.includes(`${sourcePath}/definition.data.invalid.double.error.json`), 'returns the path for `definition.data.invalid.double.error.json`')

  t.same(transformPaths(result), expected, 'returns the errors')

  t.end()
})

test('Validating files that are expected to be invalid against a schema but which are not', async (t) => {
  debugStub.reset()
  logStub.reset()
  errorStub.reset()

  const result = await validateSchema('definition.data', { specs, invalid: validFiles })
  const expected = require(path.join(path.resolve('./data/service-data/specification/expected/specs-expected-invalid.json')))
  const {
    invalid: [
      one,
      two
    ]
  } = result

  const sourcePath = 'data/service-data/specification/specs-a/specifications/definition/data/data/valid'

  t.ok(one.path.includes(`${sourcePath}/definition.data.json`), 'returns the path for `definition.data.json`')
  t.ok(two.path.includes(`${sourcePath}/definition.data.optional.json`), 'returns the path for `definition.data.optional.json`')

  t.same(transformPaths(result), expected, 'returns the errors')

  t.end()
})

test('Validating against a schema and requesting debug information', async (t) => {
  debugStub.reset()
  logStub.reset()
  errorStub.reset()

  await validateSchema('definition.data', { specs, debug: true })

  const { firstCall: { args: [{ files }] } } = logStub

  t.ok(logStub.called, 'logs the debug information')
  t.ok(Array.isArray(files), 'the debug information has the field `files`')

  t.end()
})

test('Validating against a schema and requesting debug information but warning is enabled', async (t) => {
  debugStub.reset()
  logStub.reset()
  errorStub.reset()

  await validateSchema('definition.data', { specs, debug: true, warn: true })

  t.ok(logStub.notCalled, 'does not log any debug information')

  t.end()
})

test('Validating against a schema and encountering more than one error', async (t) => {
  const doubleError = [
    './data/service-data/specification/specs-a/specifications/definition/data/data/invalid/definition.data.invalid.double.error.json'
  ]

  {
    debugStub.reset()
    logStub.reset()
    errorStub.reset()

    const result = await validateSchema('definition.data', { specs, valid: doubleError })
    const expected = require(path.join(path.resolve('./data/service-data/specification/expected/specs-expected-double.error.json')))

    t.same(transformPaths(result), expected, 'returns all errors')
  }

  {
    debugStub.reset()
    logStub.reset()
    errorStub.reset()

    const result = await validateSchema('definition.data', { specs, valid: doubleError, allErrors: false })
    const expected = require(path.join(path.resolve('./data/service-data/specification/expected/specs-expected-double.error.show-first.json')))

    t.same(transformPaths(result), expected, 'returns the first error')
  }

  t.end()
})
