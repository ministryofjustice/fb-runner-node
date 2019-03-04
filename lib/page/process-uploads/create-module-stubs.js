const {stub} = require('sinon')

const createModuleStubs = () => {
  const stubs = {}
  const stubMethods = {}
  const stubModule = (module, ...args) => {
    let async
    let method = () => {}
    if (args.length === 1) {
      if (typeof args[0] === 'boolean') {
        async = args[0]
      } else {
        method = args[0]
      }
    }
    stubMethods[module] = () => {}
    let moduleStub = stub(stubMethods, module)
    if (async) {
      moduleStub.callsFake(method = async () => {})
    }
    moduleStub.callsFake(method)
    stubs[module] = moduleStub
    return stubMethods[module]
  }

  const resetStubsHistory = () => {
    Object.keys(stubs).forEach(stub => {
      stubs[stub].resetHistory()
    })
  }

  return {
    stubModule,
    resetStubsHistory
  }
}

module.exports = createModuleStubs
