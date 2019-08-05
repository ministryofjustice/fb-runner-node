const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const childProcess = require('child_process')
const execSyncStub = stub(childProcess, 'execSync')

const installSources = proxyquire('./sources-install', {
  child_process: childProcess
})

test('When installing the service sources', t => {
  installSources('servicePath')

  t.equals(execSyncStub.getCall(0).args[0], 'cd servicePath && npm install', 'it should change to the service directory and execute npm install')
  t.ok(execSyncStub.calledOnce, 'it should do the npm install only once')

  t.end()
})
