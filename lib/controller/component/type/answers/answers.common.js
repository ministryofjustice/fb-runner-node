const jsonPath = require('jsonpath')
const striptags = require('striptags')

const {
  getInstanceTitleSummary
} = require('../../../../service-data/service-data')

const {
  getUrl,
  getNextPage
} = require('../../../../route/route')

const {format} = require('../../../../format/format')

const {
  getDisplayValue
} = require('../../../../page/page')

const isUndefinedOrNull = (value) => value === undefined || value === null
const isCurrentPageInstance = ({_id: cid = 'cid'} = {}, {_id: pid = 'pid'} = {}) => cid === pid
const hasQuestions = (questionInstances = []) => questionInstances.length > 0
const hasMultipleQuestions = (questionInstances = []) => questionInstances.length > 1

function formatDisplayValueForCheckbox ({contentLang: lang}, displayValue) {
  return format(String(displayValue), {}, {substitution: true, markdown: true, multiline: true, lang})
    .replace(/&amp;/g, '&')
}

function formatSectionHeading (userData, value, param = {}) {
  const scopedUserData = userData.getScopedUserData({param})

  return format(value, scopedUserData, {lang: userData.contentLang})
}

function getQuestionText ({contentLang}, questionInstance) {
  if (contentLang === 'cy') {
    return questionInstance['label:cy'] || questionInstance['legend:cy']
  }

  return questionInstance.label || questionInstance.legend
}

function getHeadingText ({contentLang}, currentInstance) {
  if (contentLang === 'cy') {
    return currentInstance['heading:cy']
  }

  return currentInstance.heading
}

function getSubsequentPage (previousPage, userData, pageInstance) {
  const currentPage = getNextPage(previousPage, userData)

  if (!isCurrentPageInstance(currentPage, pageInstance)) {
    return currentPage
  }
}

function getQuestionInstances (currentInstance, userData) {
  return jsonPath.query(currentInstance, '$..[?((@.name && @._type !== "checkbox") || @._type === "checkboxes")]')
    .filter(({_type, _id}) => _type && _id)
    .filter(({_type}) => _type !== 'button')
    .filter(({$conditionalShow}) => { // NB. this mirrors the same check in process-input
      if ($conditionalShow) {
        return userData.evaluate($conditionalShow)
      }
      return true
    })
}

function getDisplayValueForCheckbox (userData, {_id, value}) {
  const answerValue = getInstanceTitleSummary(_id) || value
  /*
   *  Assume already filtered away undefined or null
   */
  return String(answerValue) === ''
    ? 'Not answered'
    : formatDisplayValueForCheckbox(userData, answerValue)
}

function getChangeAction (questionInstance, currentPage, currentInstance, userData, pageInstance) {
  return {
    actions: {
      items: [
        {
          href: getChangeHref(currentPage, currentInstance, userData, pageInstance),
          text: getChangeText(userData),
          visuallyHiddenText: getVisuallyHiddenText(userData, questionInstance)
        }
      ]
    }
  }
}

function getAnswerKey (answerKey) {
  /*
   *  `String()` is safer than `toString` since some data types
   *  (such as undefined or null) do not have a `toString` method
   */
  const html = String(answerKey)
  const text = striptags(html)

  return {
    html,
    text
  }
}

function getAnswerValue (answerValue, value) {
  /*
   *  `String()` is safer than `toString` since some data types
   *  (such as undefined or null) do not have a `toString` method
   */
  const html = String(answerValue)
  const text = striptags(html)

  return {
    html,
    text,
    machine: value !== undefined
      ? value
      : text
  }
}

/*
 *  (currentPage, currentInstance, userData, pageInstance)
 */
function getChangeHref ({params}, {_id}, {contentLang}, {url = ''}) {
  return `${getUrl(_id, params, contentLang)}/change${url}`
}

/*
 *  (userData)
 */
function getChangeText ({contentLang}) {
  return contentLang === 'cy'
    ? 'Newid'
    : 'Change'
}

function getVisuallyHiddenText (userData, questionInstance) {
  const {
    contentLang
  } = userData
  const questionText = getQuestionText(userData, questionInstance)

  return contentLang === 'cy'
    ? `Your answer for ${questionText}` // TODO
    : `Your answer for ${questionText}`
}

function createAnswerBucketItem (page, component, key, value, changeAction = {}, groupBy = component) {
  return {
    page,
    component,
    key,
    value,
    ...changeAction,
    groupBy
  }
}

function getAnswerBucketItem (questionInstance, {hideChangeAction = false}, currentPage, currentInstance, userData, pageInstance) {
  const currentInstanceId = currentInstance._id
  const {name: questionName} = questionInstance
  const value = userData.getUserDataProperty(questionName)
  const questionText = getQuestionText(userData, questionInstance)
  const displayValue = getDisplayValue(pageInstance, userData, questionInstance)
  const changeAction = ( // eslint-disable-line
    !hideChangeAction &&
    getChangeAction(questionInstance, currentPage, currentInstance, userData, pageInstance)
  )
  const answerKey = getAnswerKey(questionText)
  const answerValue = getAnswerValue(displayValue, value)
  const {
    _id: questionInstanceId
  } = questionInstance

  return createAnswerBucketItem(
    currentInstanceId,
    questionName,
    answerKey,
    answerValue,
    changeAction,
    questionInstanceId)
}

function createAnswerBucket (answers = []) {
  const answerBucket = []

  answers.push({
    answers: answerBucket
  })

  return answerBucket
}

function getAnswerBucketItemForFileUpload (questionInstance, {hideChangeAction = false}, currentPage, currentInstance, userData, pageInstance) {
  const currentInstanceId = currentInstance._id
  const {name: questionName} = questionInstance
  const value = userData.getUserDataProperty(questionName) || []
  const questionText = getQuestionText(userData, questionInstance)
  const displayValue = getDisplayValue(pageInstance, userData, questionInstance)
  const changeAction = ( // eslint-disable-line
    !hideChangeAction &&
    getChangeAction(questionInstance, currentPage, currentInstance, userData, pageInstance)
  )
  const answerKey = getAnswerKey(questionText)
  const answerValue = getAnswerValue(displayValue, value)
  const {
    _id: questionInstanceId
  } = questionInstance

  return createAnswerBucketItem(
    currentInstanceId,
    questionName,
    answerKey,
    answerValue,
    changeAction,
    questionInstanceId)
}

function getAnswerBucketItemForCheckbox (questionInstanceItem, questionInstance, {hideChangeAction = false}, currentPage, currentInstance, userData, pageInstance) {
  const {
    _id: currentInstanceId
  } = currentInstance
  const {
    name: questionName,
    value
  } = questionInstanceItem
  const questionText = getQuestionText(userData, questionInstance)
  const displayValue = getDisplayValueForCheckbox(userData, questionInstanceItem)
  const changeAction = ( // eslint-disable-line
    !hideChangeAction &&
    getChangeAction(questionInstance, currentPage, currentInstance, userData, pageInstance)
  )
  const answerKey = getAnswerKey(questionText)
  const answerValue = getAnswerValue(displayValue, value)
  const {
    _id: questionInstanceId
  } = questionInstance

  return createAnswerBucketItem(
    currentInstanceId,
    questionName,
    answerKey,
    answerValue,
    changeAction,
    questionInstanceId)
}

function getAnswerBucketItemsForCheckboxes (
  questionInstance,
  componentInstance,
  currentPage,
  currentInstance,
  userData,
  pageInstance
) {
  const {
    items = []
  } = questionInstance

  return items
    .filter(({value = 'yes', name}) => value === userData.getUserDataInputProperty(name))
    .map((questionInstanceItem) => getAnswerBucketItemForCheckbox(
      questionInstanceItem,
      questionInstance,
      componentInstance,
      currentPage,
      currentInstance,
      userData,
      pageInstance
    ))
}

function populateParentDeletableAnswers (questionInstance, answers) {
  if (questionInstance.$parentDeletable) {
    answers.push({
      remove: questionInstance.$parentDeleteValue,
      repeatableDelete: questionInstance.$parentRepeatableDelete
    })

    return true
  }

  return false
}

function populateParentAddableAnswers (questionInstance, answers, {_id}) {
  if (questionInstance.$parentAddable) {
    answers.push({
      add: `${_id}/${questionInstance.$parentAddValue}`,
      repeatableAdd: questionInstance.$parentRepeatableAdd
    })

    return true
  }

  return false
}

function populateParentRepeatableHeadingAnswers (questionInstance, answers, level) {
  if (questionInstance.$parentRepeatableHeading) {
    answers.push({
      heading: questionInstance.$parentRepeatableHeading,
      repeatable: true,
      level
    })

    return true
  }

  return false
}

function populateRepeatableHeadingAnswers (questionInstance, pageHeading, answers, level) {
  if (questionInstance.$count === 1) {
    if (questionInstance.repeatable) {
      if (questionInstance.repeatableHeading) {
        if (pageHeading !== questionInstance.repeatableHeading) {
          answers.push({
            heading: questionInstance.repeatableHeading,
            level: level + 1
          })

          return true
        }
      }
    }
  }

  return false
}

function populateStepAddAnswers (stepAdd, answers) {
  if (stepAdd) {
    answers.push(stepAdd)

    return true
  }

  return false
}

function populateStepRemoveAnswers (stepRemove, answers) {
  if (stepRemove) {
    answers.push(stepRemove)

    return true
  }

  return false
}

function populateCheckboxesAnswerBucket (answerBucket, ...args) {
  const answerBucketItems = getAnswerBucketItemsForCheckboxes(...args)

  answerBucketItems
    .forEach((answerBucketItem) => {
      answerBucket.push(answerBucketItem)
    })
}

function populateFileUploadAnswerBucket (answerBucket, ...args) {
  const answerBucketItem = getAnswerBucketItemForFileUpload(...args)

  answerBucket.push(answerBucketItem)
}

function populateDefaultAnswerBucket (answerBucket, ...args) {
  const answerBucketItem = getAnswerBucketItem(...args)

  answerBucket.push(answerBucketItem)
}

function populateAnswerBucket (answerBucket, questionInstance, ...args) {
  const {_type} = questionInstance

  switch (_type) {
    case 'checkboxes':
      populateCheckboxesAnswerBucket(answerBucket, questionInstance, ...args)
      break
    case 'fileupload':
      populateFileUploadAnswerBucket(answerBucket, questionInstance, ...args)
      break
    default:
      populateDefaultAnswerBucket(answerBucket, questionInstance, ...args)
      break
  }
}

module.exports = {
  isUndefinedOrNull,
  isCurrentPageInstance,

  hasQuestions,
  hasMultipleQuestions,

  formatSectionHeading,

  getQuestionText,
  getHeadingText,

  getSubsequentPage,

  getQuestionInstances,

  getAnswerKey,
  getAnswerValue,
  getChangeHref,
  getChangeText,
  getVisuallyHiddenText,

  createAnswerBucket,

  populateParentDeletableAnswers,
  populateParentAddableAnswers,
  populateParentRepeatableHeadingAnswers,
  populateRepeatableHeadingAnswers,
  populateStepAddAnswers,
  populateStepRemoveAnswers,

  populateAnswerBucket
}
