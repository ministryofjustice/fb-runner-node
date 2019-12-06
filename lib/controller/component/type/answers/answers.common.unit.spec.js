require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

/**
 * https://remysharp.com/2016/02/08/testing-tape-vs-tap
 */
const {
  test
} = require('tap')

const sinon = require('sinon')

const {
  populateAnswerBucket: populateAnswerBucketExpectedData,
  populateFileUploadAnswerBucket: populateFileUploadAnswerBucketExpectedData,
  populateCheckboxesAnswerBucket: populateCheckboxesAnswerBucketExpectedData
} = require('./answers.common.unit.mock-data')

const filterStub = {
  filter: sinon.stub()
}

const jsonPathStub = {
  query: sinon.stub().returns(filterStub)
}

const striptagsStub = sinon.stub()

const getInstanceTitleSummaryStub = sinon.stub()

const getUrlStub = sinon.stub()
const getNextPageStub = sinon.stub()
const getDisplayValueStub = sinon.stub()
const formatStub = sinon.stub()

const {
  isCurrentPageInstance,

  hasQuestions,
  hasMultipleQuestions,

  getQuestionText,
  getHeadingText,
  formatSectionHeading,

  getSubsequentPage,

  getQuestionInstances,

  getAnswerKey,
  getAnswerValue,
  getChangeHref,
  getChangeText,
  getVisuallyHiddenText,

  createAnswerBucket,
  createAnswerBucketItem,

  populateParentDeletableAnswers,
  populateParentAddableAnswers,
  populateParentRepeatableHeadingAnswers,
  populateRepeatableHeadingAnswers,
  populateStepAddAnswers,
  populateStepRemoveAnswers,

  populateAnswerBucket
} = proxyquire('./answers.common', {
  jsonpath: jsonPathStub,
  striptags: striptagsStub,
  '~/fb-runner-node/service-data/service-data': {
    getInstanceTitleSummary: getInstanceTitleSummaryStub
  },
  '~/fb-runner-node/route/route': {
    getUrl: getUrlStub,
    getNextPage: getNextPageStub
  },
  '~/fb-runner-node/page/page': {
    getDisplayValue: getDisplayValueStub
  },
  '~/fb-runner-node/format/format': {
    format: formatStub
  }
})

test('The current page has the same `_id` as the page instance', (t) => {
  t.equal(isCurrentPageInstance({_id: 'page id'}, {_id: 'page id'}), true, 'returns true')

  t.end()
})

test('The current page does not have the same `_id` as the page instance', (t) => {
  t.equal(isCurrentPageInstance({_id: 'page id'}, {_id: 'another page id'}), false, 'returns true')

  t.end()
})

test('The number of items in the question instances array is more than zero', (t) => {
  t.equal(hasQuestions([{}]), true, 'One item returns true')

  t.equal(hasQuestions([]), false, 'No items returns false')

  t.end()
})

test('The number of items in the question instances array is more than one', (t) => {
  t.equal(hasMultipleQuestions([{}, {}]), true, 'Two items returns true')

  t.equal(hasMultipleQuestions([{}]), false, 'One item returns false')

  t.end()
})

test('Getting the question instances as an array', (t) => {
  filterStub.filter.onCall(0).returns(filterStub)
  filterStub.filter.onCall(1).returns(filterStub)
  filterStub.filter.onCall(2).returns('question instances array')

  const currentInstance = {}
  const userData = {}

  const questionInstances = getQuestionInstances(currentInstance, userData)

  t.equal(jsonPathStub.query.getCall(0).args[0], currentInstance, 'calls `jsonpath.query()` with the current instance')
  t.type(jsonPathStub.query.getCall(0).args[1], 'string', 'calls `jsonpath.query()` with the query string')

  t.equal(filterStub.filter.callCount, 3, 'is filtered')
  t.equal(questionInstances, 'question instances array', 'returns the question instances array')

  t.end()
})

test('Populating the parent deletable answers when the parent deletable parameter is true', (t) => {
  const questionInstance = {
    $parentDeletable: true,
    $parentDeleteValue: 'parent delete value',
    $parentRepeatableDelete: 'parent repeatable delete'
  }

  const answersStub = {
    push: sinon.stub()
  }

  const returnValue = populateParentDeletableAnswers(questionInstance, answersStub)

  t.deepEqual(answersStub.push.firstCall.args, [
    {
      remove: 'parent delete value',
      repeatableDelete: 'parent repeatable delete'
    }
  ], 'populates the answers array')
  t.equals(returnValue, true, 'returns true')

  t.end()
})

test('Populating the parent deletable answers when the parent deletable parameter is not true', (t) => {
  const questionInstance = {}

  const answersStub = {
    push: sinon.stub()
  }

  const returnValue = populateParentDeletableAnswers(questionInstance, answersStub)

  t.equals(answersStub.push.notCalled, true, 'does not populate the answers array')
  t.equals(returnValue, false, 'returns false')

  t.end()
})

test('Populating the step add answers when the step add parameter is defined', (t) => {
  const stepAdd = {}

  const answersStub = {
    push: sinon.stub()
  }

  const returnValue = populateStepAddAnswers(stepAdd, answersStub)

  t.equals(answersStub.push.firstCall.args[0], stepAdd, 'populates the answers array')
  t.equals(returnValue, true, 'returns true')

  t.end()
})

test('Populating the step add answers when the step add parameter is not defined', (t) => {
  const stepAdd = undefined

  const answersStub = {
    push: sinon.stub()
  }

  const returnValue = populateStepAddAnswers(stepAdd, answersStub)

  t.equals(answersStub.push.notCalled, true, 'does not populate the answers array')
  t.equals(returnValue, false, 'returns false')

  t.end()
})

test('Populating the step remove answers when the step remove parameter is defined', (t) => {
  const stepRemove = {}

  const answersStub = {
    push: sinon.stub()
  }

  const returnValue = populateStepRemoveAnswers(stepRemove, answersStub)

  t.equals(answersStub.push.firstCall.args[0], stepRemove, 'populates the answers array')
  t.equals(returnValue, true, 'returns true')

  t.end()
})

test('Populating the step remove answers when the step remove parameter is not defined', (t) => {
  const stepRemove = undefined

  const answersStub = {
    push: sinon.stub()
  }

  const returnValue = populateStepRemoveAnswers(stepRemove, answersStub)

  t.equals(answersStub.push.notCalled, true, 'does not populate the answers array')
  t.equals(returnValue, false, 'returns false')

  t.end()
})

test('Populating the parent addable answers when the parent addable parameter is true', (t) => {
  const questionInstance = {
    $parentAddable: true,
    $parentAddValue: 'parent add value',
    $parentRepeatableAdd: 'parent repeatable add'
  }

  const answersStub = {
    push: sinon.stub()
  }

  const currentInstance = {_id: 'current instance id'}

  const returnValue = populateParentAddableAnswers(questionInstance, answersStub, currentInstance)

  t.deepEqual(answersStub.push.firstCall.args, [
    {
      add: 'current instance id/parent add value',
      repeatableAdd: 'parent repeatable add'
    }
  ], 'populates the answers array')
  t.equals(returnValue, true, 'returns true')

  t.end()
})

test('Populating the parent addable answers when the parent addable parameter is not true', (t) => {
  const questionInstance = {}

  const answersStub = {
    push: sinon.stub()
  }

  const currentInstance = {}

  const returnValue = populateParentAddableAnswers(questionInstance, answersStub, currentInstance)

  t.equals(answersStub.push.notCalled, true, 'does not populate the answers array')
  t.equals(returnValue, false, 'returns false')

  t.end()
})

test('Populating the parent repeatable heading answers when the parent repeatable heading parameter is defined', (t) => {
  const questionInstance = {
    $parentRepeatableHeading: 'parent repeatable heading'
  }

  const answersStub = {
    push: sinon.stub()
  }

  const level = 2

  const returnValue = populateParentRepeatableHeadingAnswers(questionInstance, answersStub, level)

  t.deepEqual(answersStub.push.firstCall.args, [
    {
      heading: 'parent repeatable heading',
      repeatable: true,
      level: 2
    }
  ], 'populates the answers array')
  t.equals(returnValue, true, 'returns true')

  t.end()
})

test('Populating the parent repeatable heading answers when the parent repeatable heading parameter is not defined', (t) => {
  const questionInstance = {}

  const answersStub = {
    push: sinon.stub()
  }

  const level = 2

  const returnValue = populateParentRepeatableHeadingAnswers(questionInstance, answersStub, level)

  t.equals(answersStub.push.notCalled, true, 'does not populate the answers array')
  t.equals(returnValue, false, 'returns false')

  t.end()
})

test('Populating the repeatable heading answers with parameters and a repeatable heading is defined which is the same as the page heading', (t) => {
  const questionInstance = {
    $count: 1,
    repeatable: true,
    repeatableHeading: 'page heading'
  }

  const pageHeading = 'page heading'

  const answersStub = {
    push: sinon.stub()
  }

  const level = 2

  const returnValue = populateRepeatableHeadingAnswers(questionInstance, pageHeading, answersStub, level)

  t.equals(answersStub.push.notCalled, true, 'does not populate the answers array')
  t.equals(returnValue, false, 'returns false')

  t.end()
})

test('Populating the repeatable heading answers with parameters and a repeatable heading is defined which is not the same as the page heading', (t) => {
  const questionInstance = {
    $count: 1,
    repeatable: true,
    repeatableHeading: 'repeatable heading'
  }

  const pageHeading = 'page heading'

  const answersStub = {
    push: sinon.stub()
  }

  const level = 2

  const returnValue = populateRepeatableHeadingAnswers(questionInstance, pageHeading, answersStub, level)

  t.equals(answersStub.push.calledOnce, true, 'populates the answers array')
  t.deepEqual(answersStub.push.firstCall.args, [
    {
      heading: 'repeatable heading',
      level: 3
    }
  ], 'populates the answers array')
  t.equals(returnValue, true, 'returns true')

  t.end()
})

test('Populating the repeatable heading answers without parameters', (t) => {
  const questionInstance = {}

  const pageHeading = 'page heading'

  const answersStub = {
    push: sinon.stub()
  }

  const level = 2

  const returnValue = populateRepeatableHeadingAnswers(questionInstance, pageHeading, answersStub, level)

  t.equals(answersStub.push.notCalled, true, 'does not populate the answers array')
  t.equals(returnValue, false, 'returns false')

  t.end()
})

test('Populating the answer bucket', (t) => {
  getUrlStub.reset()
  getDisplayValueStub.reset()
  striptagsStub.reset()

  const answerBucketStub = {
    push: sinon.stub()
  }

  const questionInstance = {name: 'component name', label: 'component label'}
  const componentInstance = {hideChangeAction: false}
  const currentPage = {params: 'params'}
  const currentInstance = {_id: 'page id'}
  const userDataStub = {
    contentLang: 'default content lang',
    getUserDataProperty: sinon.stub().returns('user data property')
  }
  const pageInstance = {url: '/page-url'}

  getUrlStub.returns('page-url')
  getDisplayValueStub.returns('display value')
  striptagsStub.returns('stripped text')

  populateAnswerBucket(answerBucketStub, questionInstance, componentInstance, currentPage, currentInstance, userDataStub, pageInstance)

  t.equals(striptagsStub.getCall(0).args[0], 'component label', 'removes html from the component label')
  t.equals(striptagsStub.getCall(1).args[0], 'display value', 'removes html from the display value')
  t.deepEqual(getUrlStub.firstCall.args, ['page id', 'params', 'default content lang'], 'gets the url')
  t.deepEqual(answerBucketStub.push.firstCall.args[0], populateAnswerBucketExpectedData, 'populates the answers array')

  t.end()
})

test('Populating the answer bucket for a file upload component when a file has been uploaded', (t) => {
  getUrlStub.reset()
  getDisplayValueStub.reset()
  striptagsStub.reset()

  const answerBucketStub = {
    push: sinon.stub()
  }

  const questionInstance = {name: 'component name', label: 'component label', _type: 'fileupload'}
  const componentInstance = {hideChangeAction: false}
  const currentPage = {params: 'params'}
  const currentInstance = {_id: 'page id'}
  const userDataStub = {
    contentLang: 'default content lang',
    getUserDataProperty: sinon.stub().returns([])
  }
  const pageInstance = {url: '/page-url'}

  getUrlStub.returns('page-url')
  getDisplayValueStub.returns('display value')
  striptagsStub.returns('stripped text')

  populateAnswerBucket(answerBucketStub, questionInstance, componentInstance, currentPage, currentInstance, userDataStub, pageInstance)

  t.equals(striptagsStub.getCall(0).args[0], 'component label', 'removes html from the component label')
  t.equals(striptagsStub.getCall(1).args[0], 'display value', 'removes html from the display value')
  t.deepEqual(getUrlStub.firstCall.args, ['page id', 'params', 'default content lang'], 'gets the url')
  t.deepEqual(answerBucketStub.push.firstCall.args[0], populateFileUploadAnswerBucketExpectedData, 'populates the answers array')

  t.end()
})

test('Populating the answer bucket for a file upload component when a file has not been uploaded', (t) => {
  getUrlStub.reset()
  getDisplayValueStub.reset()
  striptagsStub.reset()

  const answerBucketStub = {
    push: sinon.stub()
  }

  const questionInstance = {name: 'component name', label: 'component label', _type: 'fileupload'}
  const componentInstance = {hideChangeAction: false}
  const currentPage = {params: 'params'}
  const currentInstance = {_id: 'page id'}
  const userDataStub = {
    contentLang: 'default content lang',
    getUserDataProperty: sinon.stub().returns(undefined)
  }
  const pageInstance = {url: '/page-url'}

  getUrlStub.returns('page-url')
  getDisplayValueStub.returns('display value')
  striptagsStub.returns('stripped text')

  populateAnswerBucket(answerBucketStub, questionInstance, componentInstance, currentPage, currentInstance, userDataStub, pageInstance)

  t.equals(striptagsStub.getCall(0).args[0], 'component label', 'removes html from the component label')
  t.equals(striptagsStub.getCall(1).args[0], 'display value', 'removes html from the display value')
  t.deepEqual(getUrlStub.firstCall.args, ['page id', 'params', 'default content lang'], 'gets the url')
  t.deepEqual(answerBucketStub.push.firstCall.args[0], populateFileUploadAnswerBucketExpectedData, 'populates the answers array')

  t.end()
})

test('Populating the answer bucket for an upload component when a file has not been uploaded', (t) => {
  getUrlStub.reset()
  getDisplayValueStub.reset()
  striptagsStub.reset()

  const answerBucketStub = {
    push: sinon.stub()
  }

  const questionInstance = {name: 'component name', label: 'component label', _type: 'upload'}
  const componentInstance = {hideChangeAction: false}
  const currentPage = {params: 'params'}
  const currentInstance = {_id: 'page id'}
  const userDataStub = {
    contentLang: 'default content lang',
    getUserDataProperty: sinon.stub().returns(undefined)
  }
  const pageInstance = {url: '/page-url'}

  getUrlStub.returns('page-url')
  getDisplayValueStub.returns('display value')
  striptagsStub.returns('stripped text')

  populateAnswerBucket(answerBucketStub, questionInstance, componentInstance, currentPage, currentInstance, userDataStub, pageInstance)

  t.equals(striptagsStub.getCall(0).args[0], 'component label', 'removes html from the component label')
  t.equals(striptagsStub.getCall(1).args[0], 'display value', 'removes html from the display value')
  t.deepEqual(getUrlStub.firstCall.args, ['page id', 'params', 'default content lang'], 'gets the url')
  t.deepEqual(answerBucketStub.push.firstCall.args[0], populateFileUploadAnswerBucketExpectedData, 'populates the answers array')

  t.end()
})

test('Populating the answer bucket for a checkboxes component with a value', (t) => {
  getUrlStub.reset()
  getDisplayValueStub.reset()
  striptagsStub.reset()

  getInstanceTitleSummaryStub.reset()

  const answerBucketStub = {
    push: sinon.stub()
  }

  const questionInstance = {
    name: 'component name',
    label: 'component label',
    _type: 'checkboxes',
    items: [
      {
        name: 'checkbox 1 name',
        value: 'checkbox 1 value'
      }
    ]
  }
  const componentInstance = {hideChangeAction: false}
  const currentPage = {params: 'params'}
  const currentInstance = {_id: 'page id'}
  const userDataStub = {
    contentLang: 'default content lang',
    getUserDataProperty: sinon.stub().returns('checkbox 1 value'),
    getUserDataInputProperty: sinon.stub().returns('checkbox 1 value')
  }
  const pageInstance = {url: '/page-url'}
  const stringStub = {
    replace: sinon.stub().returns('formatted and replaced html')
  }

  getUrlStub.returns('page-url')
  getDisplayValueStub.returns('display value')
  striptagsStub.returns('stripped text')
  formatStub.returns(stringStub)

  populateAnswerBucket(answerBucketStub, questionInstance, componentInstance, currentPage, currentInstance, userDataStub, pageInstance)

  const {
    withLabel: expectedData
  } = populateCheckboxesAnswerBucketExpectedData

  t.equals(striptagsStub.getCall(0).args[0], 'component label', 'removes html from the component label')
  t.equals(striptagsStub.getCall(1).args[0], 'formatted and replaced html', 'removes html from the formatted display value')
  t.deepEqual(getUrlStub.firstCall.args, ['page id', 'params', 'default content lang'], 'gets the url')
  t.deepEqual(answerBucketStub.push.firstCall.args[0], expectedData, 'populates the answers array')

  t.end()
})

test('Populating the answer bucket for a checkboxes component without a value', (t) => {
  getUrlStub.reset()
  getDisplayValueStub.reset()
  striptagsStub.reset()

  getInstanceTitleSummaryStub.reset()

  const answerBucketStub = {
    push: sinon.stub()
  }

  const questionInstance = {
    name: 'component name',
    label: 'component label',
    _type: 'checkboxes',
    items: [
      {
        name: 'checkbox 1 name',
        label: 'checkbox 1 label'
      }
    ]
  }
  const componentInstance = {hideChangeAction: false}
  const currentPage = {params: 'params'}
  const currentInstance = {_id: 'page id'}
  const userDataStub = {
    contentLang: 'default content lang',
    getUserDataProperty: sinon.stub().returns('checkbox 1 label'),
    getUserDataInputProperty: sinon.stub().returns('yes')
  }
  const pageInstance = {url: '/page-url'}
  const stringStub = {
    replace: sinon.stub().returns('formatted and replaced html')
  }

  getUrlStub.returns('page-url')
  getDisplayValueStub.returns('display value')
  striptagsStub.returns('stripped text')
  formatStub.returns(stringStub)

  populateAnswerBucket(answerBucketStub, questionInstance, componentInstance, currentPage, currentInstance, userDataStub, pageInstance)

  const {
    withoutLabel: expectedData
  } = populateCheckboxesAnswerBucketExpectedData

  t.equals(striptagsStub.getCall(0).args[0], 'component label', 'removes html from the component label')
  t.equals(striptagsStub.getCall(1).args[0], 'formatted and replaced html', 'removes html from the formatted display value')
  t.deepEqual(getUrlStub.firstCall.args, ['page id', 'params', 'default content lang'], 'gets the url')
  t.deepEqual(answerBucketStub.push.firstCall.args[0], expectedData, 'populates the answers array')

  t.end()
})

test('The current page is the last page', (t) => {
  const currentPage = {_id: 'page id'}
  const userData = {}
  const pageInstance = {_id: 'page id'}

  getNextPageStub.returns({_id: 'page id'})

  const subsequentPage = getSubsequentPage(currentPage, userData, pageInstance)

  t.deepEqual(getNextPageStub.firstCall.args, [currentPage, userData], 'calls `getNextPage`')
  t.equal(subsequentPage, undefined, 'does not return a subsequent page')

  t.end()
})

test('The current page is not the last page', (t) => {
  const currentPage = {_id: 'page id'}
  const userData = {}
  const pageInstance = {_id: 'page id'}

  getNextPageStub.returns({_id: 'next page id'})

  const subsequentPage = getSubsequentPage(currentPage, userData, pageInstance)

  t.deepEqual(getNextPageStub.firstCall.args, [currentPage, userData], 'calls `getNextPage`')
  t.deepEqual(subsequentPage, {_id: 'next page id'}, 'returns a subsequent page')

  t.end()
})

test('Creating an answer bucket', (t) => {
  const answersStub = {
    push: sinon.stub()
  }

  const answerBucket = createAnswerBucket(answersStub)

  t.type(answerBucket, Array, 'returns an array')
  t.deepEqual(answersStub.push.firstCall.args[0], {answers: answerBucket}, 'puts the answers bucket into the answers array')

  t.end()
})

test('Creating an answer bucket item with a change action and a group', (t) => {
  const page = 'page id'
  const component = 'question name'
  const key = {}
  const value = {}
  const changeAction = {actions: []}
  const groupBy = 'component name'

  const answerBucketItem = createAnswerBucketItem(page, component, key, value, changeAction, groupBy)

  t.deepEqual(answerBucketItem, {
    page,
    component,
    key,
    value,
    actions: [],
    groupBy
  }, 'returns the answer bucket item object with a change action')

  t.end()
})

test('Creating an answer bucket item without a group', (t) => {
  const page = 'page id'
  const component = 'question name'
  const key = {}
  const value = {}
  const changeAction = {actions: []}

  const answerBucketItem = createAnswerBucketItem(page, component, key, value, changeAction)

  t.deepEqual(answerBucketItem, {
    page,
    component,
    key,
    value,
    actions: [],
    groupBy: 'question name'
  }, 'returns the answer bucket item object with a group (defaults `groupBy` to the `component` value)')

  t.end()
})

test('Creating an answer bucket item without a change action', (t) => {
  const page = 'page id'
  const component = 'question name'
  const key = {}
  const value = {}

  const answerBucketItem = createAnswerBucketItem(page, component, key, value)

  t.deepEqual(answerBucketItem, {
    page,
    component,
    key,
    value,
    groupBy: 'question name'
  }, 'returns the answer bucket item object without a change action')

  t.end()
})

test('Getting the question text in the default language from the question instance label', (t) => {
  const userData = {contentLang: 'default language'}

  const questionInstance = {label: 'question instance label in the default language', legend: 'question instance legend in the default language'}

  const questionText = getQuestionText(userData, questionInstance)

  t.equal(questionText, 'question instance label in the default language', 'returns the label')

  t.end()
})

test('Getting the question text in the default language from the question instance legend', (t) => {
  const userData = {contentLang: 'default language'}

  const questionInstance = {legend: 'question instance legend in the default language'}

  const questionText = getQuestionText(userData, questionInstance)

  t.equal(questionText, 'question instance legend in the default language', 'returns the legend')

  t.end()
})

test('Getting the question text in Welsh from the question instance label', (t) => {
  const userData = {contentLang: 'cy'}

  const questionInstance = {'label:cy': 'question instance label in Welsh', 'legend:cy': 'question instance legend in Welsh'}

  const questionText = getQuestionText(userData, questionInstance)

  t.equal(questionText, 'question instance label in Welsh', 'returns the label')

  t.end()
})

test('Getting the question text in Welsh from the question instance legend', (t) => {
  const userData = {contentLang: 'cy'}

  const questionInstance = {'legend:cy': 'question instance legend in Welsh'}

  const questionText = getQuestionText(userData, questionInstance)

  t.equal(questionText, 'question instance legend in Welsh', 'returns the legend')

  t.end()
})

test('Getting the heading text in the default language', (t) => {
  const userData = {contentLang: 'default language'}

  const questionInstance = {heading: 'question instance heading in the default language', legend: 'question instance legend in the default language'}

  const headingText = getHeadingText(userData, questionInstance)

  t.equal(headingText, 'question instance heading in the default language', 'returns the heading')

  t.end()
})

test('Getting the heading text in Welsh', (t) => {
  const userData = {contentLang: 'cy'}

  const questionInstance = {'heading:cy': 'question instance heading in Welsh', 'legend:cy': 'question instance legend in Welsh'}

  const headingText = getHeadingText(userData, questionInstance)

  t.equal(headingText, 'question instance heading in Welsh', 'returns the heading')

  t.end()
})

test('Formatting the section heading', (t) => {
  formatStub.reset()

  const userDataStub = {
    getScopedUserData: sinon.stub().returns('scoped user data'),
    contentLang: 'content lang'
  }

  formatStub.returns('formatted section heading')

  const value = 'value'
  const param = 'param'

  const formattedSectionHeading = formatSectionHeading(userDataStub, value, param)

  t.deepEqual(userDataStub.getScopedUserData.firstCall.args, [{param: 'param'}], 'calls `userData.getScopedUserData`')
  t.deepEqual(formatStub.firstCall.args, ['value', 'scoped user data', {lang: 'content lang'}], 'calls `format`')
  t.equal(formattedSectionHeading, 'formatted section heading', 'returns the formatted section heading')

  t.end()
})

test('Getting the answer key', (t) => {
  striptagsStub.reset()

  striptagsStub.returns('question text')

  const questionText = 'question html'
  const answerKey = getAnswerKey(questionText)

  t.deepEqual(answerKey, {html: 'question html', text: 'question text'}, 'returns the answer key object')

  t.end()
})

test('Getting the answer value when the value is undefined', (t) => {
  striptagsStub.reset()

  striptagsStub.returns('display value text')

  const displayValue = 'display value html'
  const value = undefined

  const answerValue = getAnswerValue(displayValue, value)

  t.deepEqual(striptagsStub.firstCall.args[0], 'display value html', 'calls `striptags`')
  t.deepEqual(answerValue, {html: 'display value html', text: 'display value text', machine: 'display value text'}, 'returns the answer value object')

  t.end()
})

test('Getting the answer value when the value is not undefined', (t) => {
  striptagsStub.reset()

  striptagsStub.returns('display value text')

  const displayValue = 'display value html'
  const value = 'value'

  const answerValue = getAnswerValue(displayValue, value)

  t.deepEqual(striptagsStub.firstCall.args[0], 'display value html', 'calls `striptags`')
  t.deepEqual(answerValue, {html: 'display value html', text: 'display value text', machine: 'value'}, 'returns the answer value')

  t.end()
})

test('Getting the change href in the default language', (t) => {
  getUrlStub.reset()

  getUrlStub.returns('get-url')

  const currentPage = {params: 'params'}
  const currentInstance = {_id: 'cid'}
  const userData = {contentLang: 'default language'}
  const pageInstance = {url: '/page-url'}

  const href = getChangeHref(currentPage, currentInstance, userData, pageInstance)

  t.deepEqual(getUrlStub.firstCall.args, ['cid', 'params', 'default language'], 'gets the url')
  t.equal(href, 'get-url/change/page-url', 'returns the href')

  t.end()
})

test('Getting the change href in Welsh', (t) => {
  getUrlStub.reset()

  getUrlStub.returns('get-url')

  const currentPage = {params: 'params'}
  const currentInstance = {_id: 'cid'}
  const userData = {contentLang: 'cy'}
  const pageInstance = {url: '/page-url'}

  const href = getChangeHref(currentPage, currentInstance, userData, pageInstance)

  t.deepEqual(getUrlStub.firstCall.args, ['cid', 'params', 'cy'], 'gets the url')
  t.equal(href, 'get-url/change/page-url', 'returns the href')

  t.end()
})

test('Getting the change text in the default language', (t) => {
  const userData = {contentLang: 'default language'}

  const text = getChangeText(userData)

  t.equal(text, 'Change', 'returns the text')

  t.end()
})

test('Getting the change text in Welsh', (t) => {
  const userData = {contentLang: 'cy'}

  const text = getChangeText(userData)

  t.equal(text, 'Newid', 'returns the text')

  t.end()
})

test('Getting the visually hidden text in the default language', (t) => {
  const userData = {contentLang: 'default language'}
  const questionInstance = {label: 'question instance label in the default language'}

  const visuallyHiddenText = getVisuallyHiddenText(userData, questionInstance)

  t.equal(visuallyHiddenText, 'Your answer for question instance label in the default language', 'returns the visually hidden text in the default language')

  t.end()
})

test('Getting the visually hidden text in Welsh', (t) => {
  const userData = {contentLang: 'cy'}
  const questionInstance = {'label:cy': 'question instance label in Welsh'}

  const visuallyHiddenText = getVisuallyHiddenText(userData, questionInstance)

  t.equal(visuallyHiddenText, 'Your answer for question instance label in Welsh', 'returns the visually hidden text in Welsh')

  t.end()
})
