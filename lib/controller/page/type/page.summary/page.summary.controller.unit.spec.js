const test = require('tape')
const {stub} = require('sinon')

const proxyquire = require('proxyquire')

const serviceData = require('../../../../service-data/service-data')
const getInstancePropertyStub = stub(serviceData, 'getInstanceProperty')
const getInstanceStub = stub(serviceData, 'getInstance')

const route = require('../../../../route/route')
const getUrlStub = stub(route, 'getUrl')
const getNextPageStub = stub(route, 'getNextPage')

const redirectNextPageStub = stub()

const pageSummaryController = proxyquire('./page.summary.controller', {
  '../../../../route/route': route,
  '../../../../service-data/service-data': serviceData,
  '../../../../page/redirect-next-page/redirect-next-page': redirectNextPageStub
})

getInstancePropertyStub.callsFake((_id, type) => {
  const matches = {
    isConfirmation: 'page.confirmation',
    fauxConfirmation: 'page.content'
  }
  return type === '_type' ? matches[_id] : undefined
})

getInstanceStub.callsFake(_id => {
  const matches = {
    'page.start': {
      _id: 'page.start'
    }
  }
  return matches[_id]
})

getUrlStub.callsFake(_id => {
  const matches = {
    isSubmit: '/isSubmit',
    notAnswered: '/notAnswered'
  }
  return matches[_id]
})

getNextPageStub.callsFake(args => {
  const matches = {
    isSubmit: 'isConfirmation',
    fauxSubmit: 'fauxConfirmation'
  }
  return {
    _id: matches[args._id]
  }
})

const userData = {
  getUserParams: () => ({})
}

test('When there is no next page', async t => {
  const instance = {_id: 'noSubmit'}
  const expectedInstance = await pageSummaryController.preFlight(instance, userData)
  t.equals(expectedInstance.redirect, undefined, 'it should not return an unanswered page to redirect to')
  t.end()
})

test('When the next page is not a confirmation page', async t => {
  const instance = {_id: 'fauxSubmit'}
  const expectedInstance = await pageSummaryController.preFlight(instance, userData)
  t.equals(expectedInstance.redirect, undefined, 'it should not return an unanswered page to redirect to')
  t.end()
})

test('When all previous required questions have been answered', async t => {
  const instance = {_id: 'isSubmit'}
  redirectNextPageStub.reset()
  redirectNextPageStub.callsFake(async (instance) => {
    return instance
  })
  const expectedInstance = await pageSummaryController.preFlight(instance, userData)
  t.equals(expectedInstance.redirect, undefined, 'it should not return an unanswered page to redirect to')
  t.end()
})

test('When any previous required questions have not been answered', async t => {
  const instance = {_id: 'isSubmit'}
  redirectNextPageStub.reset()
  redirectNextPageStub.callsFake(async (instance) => {
    return {
      redirect: 'notAnswered'
    }
  })
  const expectedInstance = await pageSummaryController.preFlight(instance, userData)
  t.equals(expectedInstance.redirect, '/notAnswered', 'it should return the url of an unanswered page to redirect to')
  t.end()
})

test('When all previous required questions have been answered', async t => {
  const instance = {_id: 'isSubmit'}
  redirectNextPageStub.reset()
  redirectNextPageStub.callsFake(async (instance) => {
    return {
      redirect: 'isSubmit'
    }
  })
  const expectedInstance = await pageSummaryController.preFlight(instance, userData)
  t.equals(expectedInstance.redirect, undefined, 'it should not return an unanswered page to redirect to')
  t.end()
})

test('When all previous required questions have been answered - and a url is returned', async t => {
  const instance = {_id: 'isSubmit'}
  redirectNextPageStub.reset()
  redirectNextPageStub.callsFake(async (instance) => {
    return {
      redirect: '/isSubmit'
    }
  })
  const expectedInstance = await pageSummaryController.preFlight(instance, userData)
  t.equals(expectedInstance.redirect, undefined, 'it should not return an unanswered page to redirect to')
  t.end()
})
