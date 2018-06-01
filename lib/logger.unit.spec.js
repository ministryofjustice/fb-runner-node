const test = require('tape')
const stdout = require('test-console').stdout

const logger = require('./logger')

const callLogger = (...args) => {
  const inspect = stdout.inspect()
  logger.apply(null, args)
  inspect.restore()
  return inspect.output[0]
}

test('When logger is called', t => {
  const consoleOutput = callLogger('Hello world')
  t.deepEqual(consoleOutput, 'Hello world\n', 'it should print out the message')

  t.end()
})

test('When logger is called with multiple arguments', t => {
  const consoleOutput = callLogger('Hello', 'world')
  t.deepEqual(consoleOutput, 'Hello\nworld\n', 'it should print newlines between the arguments')

  t.end()
})

test('When logger is called with an object in the arguments', t => {
  const consoleOutput = callLogger('obj', {foo: 'bar'})
  t.deepEqual(consoleOutput, 'obj\n{\n  "foo": "bar"\n}\n', 'it should JSONify the object')

  t.end()
})

test('When logger is called with an array in the arguments', t => {
  const consoleOutput = callLogger('arr', [1, 2])
  t.deepEqual(consoleOutput, 'arr\n[\n  1,\n  2\n]\n', 'it should JSONify the object')

  t.end()
})

test('When logger is called and an environment is detected', t => {
  process.env.ENV = 'any'
  const consoleOutput = callLogger('Hello world')
  delete process.env.ENV
  t.deepEqual(consoleOutput, undefined, 'it should not print out the message')

  t.end()
})
