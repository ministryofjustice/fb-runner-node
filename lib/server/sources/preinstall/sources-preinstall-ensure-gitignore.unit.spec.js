const test = require('tape')
const {stub, spy} = require('sinon')
const proxyquire = require('proxyquire')

const path = require('path')
const pathJoinSpy = spy(path, 'join')
const fs = require('fs')
const existsSyncStub = stub(fs, 'existsSync')
existsSyncStub.callsFake(path => path.includes('exists'))
const writeFileSyncStub = stub(fs, 'writeFileSync')

const ensureGitIgnore = proxyquire('./sources-preinstall-ensure-gitignore', {
  path,
  fs
})

const resetStubs = () => {
  pathJoinSpy.resetHistory()
  existsSyncStub.resetHistory()
  writeFileSyncStub.resetHistory()
}

test('When checking whether a .gitignore file exists for a service', t => {
  resetStubs()

  const expectedGitIgnorePath = path.join('/somewhere', '.gitignore')

  ensureGitIgnore('/somewhere')

  t.deepEqual(existsSyncStub.getCall(0).args[0], expectedGitIgnorePath, 'it should check the correct .gitignore path')

  t.end()
})

test('When no .gitignore exists for a service', t => {
  resetStubs()

  const expectedGitIgnorePath = path.join('/missing', '.gitignore')
  const expectedGitIgnore = `
node_modules
.DS_Store
package.json
package-lock.json
`

  ensureGitIgnore('/missing')

  t.deepEqual(writeFileSyncStub.getCall(0).args[0], expectedGitIgnorePath, 'it should create a default .gitignore file in the correct location')
  t.deepEqual(writeFileSyncStub.getCall(0).args[1], expectedGitIgnore, 'it should create a default .gitignore file with the correct values')

  t.end()
})

test('When a .gitignore exists for a service', t => {
  resetStubs()

  ensureGitIgnore('/exists')

  t.ok(writeFileSyncStub.notCalled, 'it should not overwrite the existing  .gitignore file')

  t.end()
})
