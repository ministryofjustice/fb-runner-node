const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const processControlStub = stub()

const namedInstance1 = {name: 'name1', _type: 'process'}
const namedInstance2 = {name: 'name2', _type: 'process'}
const namedInstance3 = {name: 'name3', _type: 'process'}
const pageInstance = {
  components: [
    namedInstance1,
    {
      _type: 'ignore'
    },
    namedInstance2,
    {
      _type: 'ignore',
      components: [
        namedInstance3
      ]
    }
  ]
}

const processInput = proxyquire('./process-input', {
  './process-control': processControlStub
})

const userData = {}

test('When processing the input for a page instance', t => {
  processInput(pageInstance, userData)

  t.equal(processControlStub.callCount, 3, 'it should process the expected component instances')

  t.deepEqual(processControlStub.args, [
    [pageInstance, userData, namedInstance1],
    [pageInstance, userData, namedInstance2],
    [pageInstance, userData, namedInstance3]
  ], 'it should call processControl method with the expected args')

  t.end()
})
