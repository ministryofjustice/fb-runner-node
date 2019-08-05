const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const controller = require('../../../controller/controller')

const initControllersStub = stub(controller, 'initControllers')
const addControllersStub = stub(controller, 'addControllers')
const addModuleStub = stub(controller, 'addModule')
const requireControllerStub = stub(controller, 'requireController')
requireControllerStub.callsFake(path => {
  if (path.includes('entrypoint') && !path.endsWith('controller')) {
    return 'entrypoint'
  }
  if (path.includes('controllers') && path.endsWith('controller')) {
    return 'controllers'
  }
  throw new Error('No controllers')
})

const loadControllers = proxyquire('./sources-load-controllers', {
  '../../../controller/controller': controller
})

const resetStubs = () => {
  initControllersStub.resetHistory()
  addControllersStub.resetHistory()
  addModuleStub.resetHistory()
  requireControllerStub.resetHistory()
}

test('When loading controllers', t => {
  resetStubs()

  loadControllers([{
    module: 'module-a',
    source: 'a',
    sourcePath: '/controllers/a'
  }, {
    module: 'module-b',
    source: 'b',
    sourcePath: '/entrypoint/a'
  }, {
    module: 'module-c',
    source: 'c',
    sourcePath: '/missing/c'
  }, {
    source: 'd',
    sourcePath: '/missing/d'
  }])

  t.ok(initControllersStub.calledOnce, 'it should initialise the controllers module')
  t.ok(addControllersStub.calledOnce, 'it should add controllers once')
  t.equal(addControllersStub.getCall(0).args[0], 'controllers', 'it should add the required controllers')
  t.ok(addModuleStub.calledOnce, 'it should add modules once')
  t.deepEqual(addModuleStub.getCall(0).args, ['module-b', 'entrypoint'], 'it should add the required module controller entrypoint')
  t.end()
})
