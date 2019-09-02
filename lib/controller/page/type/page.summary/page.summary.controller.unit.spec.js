const test = require('tape')
const submitterClient = require('../../../../client/submitter/submitter')
const {stub, spy} = require('sinon')

const proxyquire = require('proxyquire')

const serviceData = require('../../../../service-data/service-data')
const getInstancePropertyStub = stub(serviceData, 'getInstanceProperty')
const getInstanceStub = stub(serviceData, 'getInstance')

const route = require('../../../../route/route')
const getUrlStub = stub(route, 'getUrl')
const getNextPageStub = stub(route, 'getNextPage')

const redirectNextPageStub = stub()

const submitterClientSpy = spy(submitterClient, 'submit')

const checkSubmitsStub = (_instanceData, _userData) => true

const pageSummaryController = proxyquire('./page.summary.controller', {
  '../../../../route/route': route,
  '../../../../service-data/service-data': serviceData,
  '../../../../page/redirect-next-page/redirect-next-page': redirectNextPageStub,
  '../../../../client/submitter/submitter': {submitterClient: submitterClientSpy}
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

const getUserDataPropertyStub = stub()
const userData = {
  getUserDataProperty: getUserDataPropertyStub,
  setUserDataProperty: () => {},
  getUserParams: () => ({}),
  getUserId: () => 'userId',
  getUserToken: () => 'userToken',
  getOutputData: () => ({})
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

test('it attaches a user submission when the property is set to true', async t => {
  getUserDataPropertyStub.resetHistory()
  getUserDataPropertyStub.withArgs('email').returns('user@example.com')
  getInstancePropertyStub.withArgs('service', 'attachUserSubmission').returns(true)

  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub}
  })

  await pageSummaryController.postValidation({}, userData)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions
  t.equals(submissions[0].recipientType, 'user')
  t.equals(submissions[0].attachments.length, 1)
  submitterClientSpy.resetHistory()
  t.end()
})

test('it does not attach a user submission when the property is set to false', async t => {
  getUserDataPropertyStub.resetHistory()
  getUserDataPropertyStub.withArgs('email').returns('user@example.com')
  getInstancePropertyStub.withArgs('service', 'attachUserSubmission').returns(false)
  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub}
  })

  await pageSummaryController.postValidation({}, userData)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions

  t.equals(submissions[0].recipientType, 'user')
  t.equals(submissions[0].attachments.length, 0)
  submitterClientSpy.resetHistory()
  t.end()
})

test('it attaches json to submission when env var present', async t => {
  getUserDataPropertyStub.resetHistory()

  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub},
    '../../../../constants/constants': {
      SERVICE_OUTPUT_JSON_ENDPOINT: 'https://example.com/adaptor',
      SERVICE_OUTPUT_JSON_KEY: 'shared_key',
      RUNNER_URL: 'http://service-slug.formbuilder-services-test-dev:3000'
    }
  })

  await pageSummaryController.postValidation({}, userData)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions
  t.equals(submissions[1].type, 'json')
  t.equals(submissions[1].url, 'https://example.com/adaptor')
  t.equals(submissions[1].encryption_key, 'shared_key')
  t.equals(submissions[1].data_url, 'http://service-slug.formbuilder-services-test-dev:3000/api/submitter/json/default/userId.json')
  submitterClientSpy.resetHistory()
  t.end()
})

test('it does not attach json to submission when env var not present', async t => {
  getUserDataPropertyStub.resetHistory()

  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub}
  })

  await pageSummaryController.postValidation({}, userData)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions
  t.equals(submissions[1], undefined)
  submitterClientSpy.resetHistory()
  t.end()
})
