const test = require('tape')
const submitterClient = require('../../../../client/submitter/submitter')
const {stub, spy} = require('sinon')

const {getUserDataMethods} = require('../../../../middleware/user-data/user-data')

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

const pdfPayload = {some: 'PDF contents'}
const pdfPayloadStub = (_rawFormData) => pdfPayload
const submissionDataWithLabelsStub = stub()

const pageSummaryController = proxyquire('./page.summary.controller', {
  '../../../../route/route': route,
  '../../../../service-data/service-data': serviceData,
  '../../../../page/redirect-next-page/redirect-next-page': redirectNextPageStub,
  '../../../../client/submitter/submitter': {submitterClient: submitterClientSpy},
  '../../../../presenter/pdf-payload': {pdfPayload: pdfPayloadStub},
  '../../../../middleware/routes-output/submission-data-with-labels': {submissionDataWithLabels: submissionDataWithLabelsStub}
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
  getUserDataProperty: () => {},
  setUserDataProperty: () => {},
  getUserParams: () => ({}),
  getUserId: () => 'userId',
  getUserToken: () => 'userToken',
  getOutputData: () => ({
    mock_question_1: 'mock_answer_1'
  }),
  uploadedFiles: () => {
    return []
  }
}

const userDataWithFiles = {
  getUserDataProperty: () => {},
  setUserDataProperty: () => {},
  getUserParams: () => ({}),
  getUserId: () => 'userId',
  getUserToken: () => 'userToken',
  getOutputData: () => ({}),
  uploadedFiles: () => {
    return [{
      url: 'SUBMITTER_URL/service/SERVICE_SLUG/user/36c1af3e-a213-4293-8a82-f26ae7a23215/1568971532923',
      mimetype: 'image/png',
      filename: 'image.png',
      type: 'filestore'
    }]
  }
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
  getInstancePropertyStub.withArgs('service', 'attachUserSubmission').returns(true)

  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub},
    '../../../../presenter/pdf-payload': {pdfPayload: pdfPayloadStub},
    '../../../../middleware/routes-output/submission-data-with-labels': {submissionDataWithLabels: submissionDataWithLabelsStub},
    '../../../../constants/constants': {
      SERVICE_OUTPUT_EMAIL: 'bob@gov.uk'
    }
  })

  const userdataUserEmail = getUserDataMethods({
    input: {
      email: '\'user@example.com\''
    }
  })

  await pageSummaryController.postValidation({}, userdataUserEmail)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions

  t.equals(submissions[1].recipientType, 'user')
  t.equals(submissions[1].attachments.length, 1)
  submitterClientSpy.resetHistory()
  t.end()
})

test('it does not attach a user submission when the property is set to false', async t => {
  getInstancePropertyStub.withArgs('service', 'attachUserSubmission').returns(false)
  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub},
    '../../../../presenter/pdf-payload': {pdfPayload: pdfPayloadStub},
    '../../../../middleware/routes-output/submission-data-with-labels': {submissionDataWithLabels: submissionDataWithLabelsStub},
    '../../../../constants/constants': {
      SERVICE_OUTPUT_EMAIL: 'bob@gov.uk'
    }
  })

  const userdata = getUserDataMethods({input: {email: 'test@emample.com'}})

  await pageSummaryController.postValidation({}, userdata)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions

  t.equals(submissions[1].recipientType, 'user')
  t.equals(submissions[1].attachments.length, 0)
  submitterClientSpy.resetHistory()
  t.end()
})

test('it attaches json to submission when env var present', async t => {
  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub},
    '../../../../presenter/pdf-payload': {pdfPayload: pdfPayloadStub},
    '../../../../middleware/routes-output/submission-data-with-labels': {submissionDataWithLabels: submissionDataWithLabelsStub},
    '../../../../constants/constants': {
      SERVICE_OUTPUT_JSON_ENDPOINT: 'https://example.com/adaptor',
      SERVICE_OUTPUT_JSON_KEY: 'shared_key',
      RUNNER_URL: 'http://service-slug.formbuilder-services-test-dev:3000',
      SERVICE_OUTPUT_EMAIL: 'bob@gov.uk'
    }
  })

  const userData = getUserDataMethods({input: {mock_question_1: 'mock_answer_1'}})

  await pageSummaryController.postValidation({}, userData)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions
  t.equals(submissions[1].type, 'json')
  t.equals(submissions[1].url, 'https://example.com/adaptor')
  t.equals(submissions[1].encryption_key, 'shared_key')
  t.equals(submissions[1].user_answers.mock_question_1, 'mock_answer_1')

  t.deepEquals(submissions[1].attachments, [])
  submitterClientSpy.resetHistory()
  t.end()
})

test('when there are files it attaches them to json submission', async t => {
  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub},
    '../../../../presenter/pdf-payload': {pdfPayload: pdfPayloadStub},
    '../../../../middleware/routes-output/submission-data-with-labels': {submissionDataWithLabels: submissionDataWithLabelsStub},
    '../../../../constants/constants': {
      SERVICE_OUTPUT_JSON_ENDPOINT: 'https://example.com/adaptor',
      SERVICE_OUTPUT_JSON_KEY: 'shared_key',
      RUNNER_URL: 'http://service-slug.formbuilder-services-test-dev:3000',
      SERVICE_OUTPUT_EMAIL: 'bob@gov.uk'
    }
  })

  const userdata = getUserDataMethods({input: {firstname: 'bob'}})
  userdata.uploadedFiles = () => {
    return [{
      url: 'SUBMITTER_URL/service/SERVICE_SLUG/user/36c1af3e-a213-4293-8a82-f26ae7a23215/1568971532923',
      mimetype: 'image/png',
      filename: 'image.png',
      type: 'filestore'
    }]
  }

  await pageSummaryController.postValidation({}, userdata)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions
  t.equals(submissions[1].type, 'json')
  t.equals(submissions[1].url, 'https://example.com/adaptor')
  t.equals(submissions[1].encryption_key, 'shared_key')
  t.deepEquals(submissions[1].attachments, userDataWithFiles.uploadedFiles())
  submitterClientSpy.resetHistory()
  t.end()
})

test('when there are files it attaches to the root key attachments', async t => {
  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub},
    '../../../../presenter/pdf-payload': {pdfPayload: pdfPayloadStub},
    '../../../../middleware/routes-output/submission-data-with-labels': {submissionDataWithLabels: submissionDataWithLabelsStub}
  })

  const attachments = [
    {
      url: 'SUBMITTER_URL/service/SERVICE_SLUG/user/36c1af3e-a213-4293-8a82-f26ae7a23215/1568971532923',
      mimetype: 'image/png',
      filename: 'image_1.png',
      type: 'filestore'
    }, {
      url: 'SUBMITTER_URL/service/SERVICE_SLUG/user/36c1af3e-a213-4293-8a82-f26ae7a23215/1568971532924',
      mimetype: 'image/png',
      filename: 'image_2.png',
      type: 'filestore'
    }
  ]

  const userdata = getUserDataMethods({input: {firstname: 'bob'}})
  userdata.uploadedFiles = () => {
    return attachments
  }

  await pageSummaryController.postValidation({}, userdata)
  const submission = submitterClientSpy.getCall(0).args[0]

  t.deepEquals(submission.attachments, attachments)

  submitterClientSpy.resetHistory()
  t.end()
})

test('it does not attach json to submission when env var not present', async t => {
  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../presenter/pdf-payload': {pdfPayload: pdfPayloadStub},
    '../../../../middleware/routes-output/submission-data-with-labels': {submissionDataWithLabels: submissionDataWithLabelsStub},
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub},
    '../../../../constants/constants': {
      SERVICE_OUTPUT_EMAIL: 'bob@gov.uk'
    }
  })

  const userdata = getUserDataMethods({input: {}})

  await pageSummaryController.postValidation({}, userdata)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions
  const jsonEntries = submissions.filter(s => s.type === 'json')

  t.deepEquals(jsonEntries, [])
  submitterClientSpy.resetHistory()
  t.end()
})

test('TEAM PDF: it attaches PDF contents to email submission attachments', async t => {
  getInstancePropertyStub.withArgs('service', 'emailTemplateTeam').returns('{firstname} submitted!')

  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../presenter/pdf-payload': {pdfPayload: pdfPayloadStub},
    '../../../../middleware/routes-output/submission-data-with-labels': {submissionDataWithLabels: submissionDataWithLabelsStub},
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub},
    '../../../../constants/constants': {
      SERVICE_OUTPUT_EMAIL: 'bob@gov.uk'
    }
  })

  const userdata = getUserDataMethods({input: {firstname: 'bob'}})

  await pageSummaryController.postValidation({}, userdata)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions
  const emailEntries = submissions.filter(s => s.type === 'email')

  t.equals(emailEntries[0].email_body, 'bob submitted!')

  const pdfData = emailEntries[0].attachments[0].pdf_data
  t.deepEquals(pdfData, {some: 'PDF contents'})

  submitterClientSpy.resetHistory()
  t.end()
})

test('USER PDF: it attaches PDF contents to email submission attachments', async t => {
  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../presenter/pdf-payload': {pdfPayload: pdfPayloadStub},
    '../../../../middleware/routes-output/submission-data-with-labels': {submissionDataWithLabels: submissionDataWithLabelsStub},
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub},
    '../../../../constants/constants': {
      SERVICE_OUTPUT_EMAIL: 'bob@gov.uk'
    }
  })

  const userdata = getUserDataMethods({})
  await pageSummaryController.postValidation({}, userdata)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions
  const emailEntries = submissions.filter(s => s.type === 'email')
  const pdfData = emailEntries[0].attachments[0].pdf_data

  t.deepEquals(pdfData, {some: 'PDF contents'})
  submitterClientSpy.resetHistory()
  t.end()
})

test('Dynamic content is rendered in the Team email body', async t => {
  submitterClientSpy.resetHistory()

  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../presenter/pdf-payload': {pdfPayload: pdfPayloadStub},
    '../../../../middleware/routes-output/submission-data-with-labels': {submissionDataWithLabels: submissionDataWithLabelsStub},
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub},
    '../../../../constants/constants': {
      SERVICE_OUTPUT_EMAIL: 'bob@gov.uk'
    }
  })

  getInstancePropertyStub.withArgs('service', 'emailTemplateTeam').returns('user {firstname} submitted!')
  const userdata = getUserDataMethods({input: {firstname: 'bob'}})

  await pageSummaryController.postValidation({}, userdata)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions
  const emailEntries = submissions.filter(s => s.type === 'email')

  t.equals(emailEntries[0].recipientType, 'team')
  t.equals(emailEntries[0].email_body, 'user bob submitted!')

  submitterClientSpy.resetHistory()
  t.end()
})

test('user email body can be overridden to use a rendered template', async t => {
  submitterClientSpy.resetHistory()

  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../presenter/pdf-payload': {pdfPayload: pdfPayloadStub},
    '../../../../middleware/routes-output/submission-data-with-labels': {submissionDataWithLabels: submissionDataWithLabelsStub},
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub},
    '../../../../constants/constants': {
      SERVICE_OUTPUT_EMAIL: 'bob@gov.uk'
    }
  })

  getInstancePropertyStub.withArgs('service', 'emailTemplateUser').returns('you ({firstname}) submitted!')

  const userdata = getUserDataMethods({
    input: {
      firstname: 'bob',
      email: 'test@emample.com'
    }
  })

  await pageSummaryController.postValidation({}, userdata)

  const submissions = submitterClientSpy.getCall(0).args[0].submissions
  const emailEntries = submissions.filter(s => s.type === 'email')

  t.equals(emailEntries[1].recipientType, 'user')
  t.equals(emailEntries[1].email_body, 'you (bob) submitted!')

  submitterClientSpy.resetHistory()
  t.end()
})

test('actions contains email and json actions', async t => {
  submitterClientSpy.resetHistory()

  const pageSummaryController = proxyquire('./page.summary.controller', {
    '../../../../presenter/pdf-payload': {pdfPayload: pdfPayloadStub},
    '../../../../middleware/routes-output/submission-data-with-labels': {submissionDataWithLabels: submissionDataWithLabelsStub},
    '../../../../page/check-submits/check-submits': {checkSubmits: checkSubmitsStub},
    '../../../../constants/constants': {
      SERVICE_OUTPUT_JSON_ENDPOINT: 'https://example.com/adaptor',
      SERVICE_OUTPUT_JSON_KEY: 'shared_key',
      SERVICE_OUTPUT_EMAIL: 'bob@gov.uk'
    }
  })
  getInstancePropertyStub.withArgs('service', 'emailTemplateUser').returns('you ({firstname}) submitted!')
  const userdata = getUserDataMethods({
    input: {
      firstname: 'bob',
      email: 'test@emample.com'
    }
  })

  await pageSummaryController.postValidation({}, userdata)
  const submissions = submitterClientSpy.getCall(0).args[0]

  t.equals(submissions.actions.length, 3)

  // remove deprecated fields
  submissions.actions.map(action => {
    delete action.attachments
    delete action.user_answers
  })

  t.deepEquals(submissions.actions, [
    {
      recipientType: 'team',
      type: 'email',
      from: '"Form Builder" <form-builder@digital.justice.gov.uk>',
      subject: 'undefined submission',
      email_body: 'user bob submitted!',
      include_pdf: true,
      include_attachments: true,
      to: 'bob@gov.uk'
    }, {
      recipientType: 'user',
      type: 'email',
      from: '"Form Builder" <form-builder@digital.justice.gov.uk>',
      subject: 'Your undefined submission',
      email_body: 'you (bob) submitted!',
      include_pdf: false,
      include_attachments: false,
      to: 'test@emample.com'
    }, {
      type: 'json',
      url: 'https://example.com/adaptor',
      encryption_key: 'shared_key'
    }
  ])

  submitterClientSpy.resetHistory()
  t.end()
})
