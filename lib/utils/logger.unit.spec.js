const test = require('tape')
const stdout = require('test-console').stdout

const logger = require('./logger')

const callLogger = (verbose, ...args) => {
  const inspect = stdout.inspect()
  logger.verbose(verbose)
  logger.apply(null, args)
  logger.verbose(false)
  inspect.restore()
  return inspect.output[0]
}

test('When logger is called but verbose mode is off', t => {
  const consoleOutput = callLogger(false, 'Hello world')
  t.deepEqual(consoleOutput, undefined, 'it should not print out the message')

  t.end()
})

test('When logger is called', t => {
  const consoleOutput = callLogger(true, 'Hello world')
  t.deepEqual(consoleOutput, 'Hello world\n', 'it should print out the message')

  t.end()
})

test('When logger is called with multiple arguments', t => {
  const consoleOutput = callLogger(true, 'Hello', 'world')
  t.deepEqual(consoleOutput, 'Hello\nworld\n', 'it should print newlines between the arguments')

  t.end()
})

test('When logger is called with an object in the arguments', t => {
  const consoleOutput = callLogger(true, 'obj', {foo: 'bar'})
  t.deepEqual(consoleOutput, 'obj\n{\n  "foo": "bar"\n}\n', 'it should JSONify the object')

  t.end()
})

test('When logger is called with an array in the arguments', t => {
  const consoleOutput = callLogger(true, 'arr', [1, 2])
  t.deepEqual(consoleOutput, 'arr\n[\n  1,\n  2\n]\n', 'it should JSONify the object')

  t.end()
})
