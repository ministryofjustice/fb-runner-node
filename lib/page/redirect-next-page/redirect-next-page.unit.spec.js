const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const route = require('../../route/route')
const getRedirectUrlStub = stub(route, 'getRedirectUrl')
const getUrlStub = stub(route, 'getUrl')
const getDataStub = stub(route, 'getData')
const getNextPageStub = stub(route, 'getNextPage')
const getNextUrlStub = stub(route, 'getNextUrl')
const checkPageIdParamsStub = stub(route, 'checkPageIdParams')

const serviceData = require('../../service-data/service-data')
const getInstanceStub = stub(serviceData, 'getInstance')

const format = require('../../format/format')
const formatStub = stub(format, 'format')

const skipPageStub = stub()
const setControlNamesStub = stub()
const setCompositeStub = stub()
const setRepeatableStub = stub()
const skipComponentsStub = stub()
const validateInputStub = stub()

const getUserParamsStub = stub()
const userData = {
  getUserParams: getUserParamsStub,
  contentLang: 'contentLang'
}

const redirectNextPage = proxyquire('./redirect-next-page', {
  '../../route/route': route,
  '../../service-data/service-data': serviceData,
  '../../format/format': format,
  '../skip-page/skip-page': skipPageStub,
  '../set-control-names/set-control-names': setControlNamesStub,
  '../set-composite/set-composite': setCompositeStub,
  '../set-repeatable/set-repeatable': setRepeatableStub,
  '../skip-components/skip-components': skipComponentsStub,
  '../validate-input/validate-input': validateInputStub
})

const resetStubs = () => {
  getRedirectUrlStub.resetHistory()
  getRedirectUrlStub.returns()
  getUrlStub.resetHistory()
  getUrlStub.callsFake(_id => `/${_id || 'url'}`)
  getDataStub.resetHistory()
  getDataStub.callsFake(_id => {
    return {
      route: _id,
      params: {}
    }
  })
  getNextPageStub.resetHistory()
  getNextPageStub.callsFake(_id => {
    return {
      _id: 'anotherPage'
    }
  })
  getNextUrlStub.resetHistory()
  getNextUrlStub.returns()
  checkPageIdParamsStub.resetHistory()
  checkPageIdParamsStub.returns(true)

  getInstanceStub.resetHistory()
  getInstanceStub.callsFake(_id => {
    return {
      _id
    }
  })

  formatStub.resetHistory()
  formatStub.callsFake(str => str)

  const instanceMethodStubs = [
    skipPageStub,
    setControlNamesStub,
    setCompositeStub,
    setRepeatableStub,
    skipComponentsStub,
    validateInputStub
  ]
  instanceMethodStubs.forEach(instanceMethodStub => {
    instanceMethodStub.resetHistory()
    instanceMethodStub.callsFake(instance => instance)
  })

  getUserParamsStub.resetHistory()
  getUserParamsStub.returns({})
}

test('When a page instance has invalid input', async t => {
  resetStubs()

  const pageInstance = {}

  const redirectPageInstance = await redirectNextPage(pageInstance, userData)
  t.equal(redirectPageInstance.redirect, undefined, 'it should not set the instance’s redirect property')
  t.ok(getNextUrlStub.notCalled, 'it should not call getNextUrl method')

  t.end()
})

test('When a page instance does not have another page following it', async t => {
  resetStubs()

  const pageInstance = {
    $validated: true
  }

  const redirectPageInstance = await redirectNextPage(pageInstance, userData)
  t.equal(redirectPageInstance.redirect, undefined, 'it should not set the instance’s redirect property')
  t.ok(getNextUrlStub.calledOnce, 'it should call the getNextUrl method')

  t.ok(getUrlStub.notCalled, 'it should not call getUrl method')

  t.end()
})

test('When a page instance has another page following it', async t => {
  resetStubs()
  getUserParamsStub.returns({
    foo: 'bar'
  })
  getNextUrlStub.returns('nextUrl')

  const pageInstance = {
    _id: 'pageId',
    $validated: true
  }

  const redirectPageInstance = await redirectNextPage(pageInstance, userData)
  t.equal(redirectPageInstance.redirect, 'nextUrl', 'it should set the instance’s redirect property to the expected value')
  t.ok(getNextUrlStub.calledOnce, 'it should call the getNextUrl method')
  t.deepEqual(getNextUrlStub.getCall(0).args, [{
    _id: pageInstance._id,
    params: {
      foo: 'bar'
    }
  },
  userData], 'it should call the getNextUrl method with the expected args')

  t.end()
})

test('When the page should be redirected in the light of a specified change page', async t => {
  resetStubs()

  const pageInstance = {
    _id: 'pageId',
    $validated: true,
    changepage: 'changePage'
  }

  await redirectNextPage(pageInstance, userData)
  t.ok(getNextUrlStub.notCalled, 'it should not call the getNextUrl method')

  t.ok(getUrlStub.calledOnce, 'it should call the getUrl method')
  t.deepEqual(getUrlStub.getCall(0).args, ['pageId', {}, 'contentLang'], 'it should call the getUrl method with the expected methods')

  t.end()
})

test('When the page should be redirected to a page other than the specified change page', async t => {
  resetStubs()

  getUrlStub.returns('nonChangePageUrl')
  getRedirectUrlStub.returns('nonChangePageUrlRedirect')

  const pageInstance = {
    _id: 'pageId',
    $validated: true,
    changepage: 'changePage'
  }

  const redirectPageInstance = await redirectNextPage(pageInstance, userData)
  t.equal(redirectPageInstance.redirect, 'nonChangePageUrlRedirect', 'it should not set the instance’s redirect property')

  t.ok(getRedirectUrlStub.calledOnce, 'it should call the getRedirectUrl method')
  t.deepEqual(getRedirectUrlStub.getCall(0).args, ['nonChangePageUrl', 'changePage'], 'it should call the getRedirectUrl method with the expected methods')

  t.end()
})

test('When the page should be redirected to the specified change page', async t => {
  resetStubs()

  getUrlStub.returns('changePage')

  const pageInstance = {
    _id: 'pageId',
    $validated: true,
    changepage: 'changePage'
  }

  const redirectPageInstance = await redirectNextPage(pageInstance, userData)
  t.equal(redirectPageInstance.redirect, 'changePage', 'it should set the instance’s redirect property to te expected value')

  t.end()
})

test('When attempting to redirect to the specified change page but an intervening page has invalid input', async t => {
  resetStubs()

  checkPageIdParamsStub.returns(false)

  const pageInstance = {
    _id: 'pageId',
    $validated: true,
    changepage: 'changePage'
  }

  await redirectNextPage(pageInstance, userData)

  t.deepEqual(getUrlStub.getCall(0).args[0], 'anotherPage', 'it should redirect to the page with invalid input')

  t.end()
})

test('When attempting to redirect to the specified change page and an intervening page has valid input', async t => {
  resetStubs()

  checkPageIdParamsStub.callsFake((changePage, input) => {
    return input._id === 'finalPage'
  })
  validateInputStub.callsFake(instance => {
    if (instance._id === 'anotherPage') {
      instance.$validated = true
    }
    return instance
  })

  getNextPageStub.callsFake(instance => {
    if (instance._id === 'anotherPage') {
      return {
        _id: 'finalPage'
      }
    }
    return {
      _id: 'anotherPage'
    }
  })

  const pageInstance = {
    _id: 'pageId',
    $validated: true,
    changepage: 'changePage'
  }

  await redirectNextPage(pageInstance, userData)
  t.deepEqual(getUrlStub.getCall(0).args[0], 'finalPage', 'it should skip any pages that are valid')

  t.end()
})

test('When attempting to redirect to the specified change page and an intervening page should be skipped', async t => {
  resetStubs()

  checkPageIdParamsStub.callsFake((changePage, input) => {
    return input._id === 'finalPage'
  })
  skipPageStub.callsFake(instance => {
    if (instance._id === 'anotherPage') {
      instance.redirect = 'anotherRedirect'
    }
    return instance
  })

  getNextPageStub.callsFake(instance => {
    if (instance._id === 'anotherPage') {
      return {
        _id: 'finalPage'
      }
    }
    return {
      _id: 'anotherPage'
    }
  })

  const pageInstance = {
    _id: 'pageId',
    $validated: true,
    changepage: 'changePage'
  }

  await redirectNextPage(pageInstance, userData)
  t.deepEqual(getUrlStub.getCall(0).args[0], 'finalPage', 'it should skip any pages that should be skipped')

  t.end()
})

test('When attempting to redirect to the specified change page and intervening page has namespace', async t => {
  resetStubs()
  checkPageIdParamsStub.returns(false)
  getNextPageStub.returns({
    _id: 'anotherPage',
    params: {biff: 'baz'}
  })
  getInstanceStub.callsFake(_id => {
    return {
      _id,
      namePrefix: 'namePrefix'
    }
  })
  formatStub.returns('updatedNameprefix')

  const pageInstance = {
    _id: 'pageId',
    $validated: true,
    changepage: 'changePage'
  }

  await redirectNextPage(pageInstance, userData)

  t.deepEqual(formatStub.getCall(0).args, ['namePrefix', {biff: 'baz'}, {markdown: false}], 'it should call format method with the expected args ')
  t.deepEqual(skipPageStub.getCall(0).args[0].namePrefix, 'updatedNameprefix', 'it should add the name prefix to potential next instances before validating them')

  t.deepEqual(getUrlStub.getCall(0).args, ['anotherPage', {biff: 'baz'}, 'contentLang'], 'it should call getUrl method with the expected args including the route params')

  t.end()
})
