require('@ministryofjustice/module-alias/register-module')(module)

const jsonPath = require('jsonpath')
const striptags = require('striptags')

const getComponentController = require('~/fb-runner-node/controller/component/get-controller')

const {
  getUrl,
  getNextPage
} = require('~/fb-runner-node/route/route')

const {
  format
} = require('~/fb-runner-node/format/format')

const {
  transformFile,
  hasComponentAcceptedAnyFiles,
  getComponentAcceptedFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const isUndefinedOrNull = (value) => value === undefined || value === null
const isCurrentPageInstance = ({ _id: cid = 'cid' } = {}, { _id: pid = 'pid' } = {}) => cid === pid
const hasQuestions = (questionInstances = []) => questionInstances.length > 0
const hasMultipleQuestions = (questionInstances = []) => questionInstances.length > 1

function formatSectionHeading (userData, value, param = {}) {
  const scopedUserData = userData.getScopedUserData({ param })

  return format(value, scopedUserData, { lang: userData.contentLang })
}

function getLabelField ({ contentLang } = {}) {
  return contentLang
    ? 'label:'.concat(contentLang)
    : 'label'
}

function getLegendField ({ contentLang } = {}) {
  return contentLang
    ? 'legend:'.concat(contentLang)
    : 'legend'
}

function getHeadingField ({ contentLang } = {}) {
  return contentLang
    ? 'heading:'.concat(contentLang)
    : 'heading'
}

function getQuestionText (questionInstance = {}, userData = {}) {
  return (
    questionInstance[getLabelField(userData)] || questionInstance[getLegendField(userData)] ||
    questionInstance[getLabelField()] || questionInstance[getLegendField()]
  )
}

function getHeadingText (currentInstance = {}, userData = {}) {
  return (
    currentInstance[getHeadingField(userData)] ||
    currentInstance[getHeadingField()]
  )
}

function getSubsequentPage (previousPage, userData, pageInstance) {
  const currentPage = getNextPage(previousPage, userData)

  if (!isCurrentPageInstance(currentPage, pageInstance)) {
    return currentPage
  }
}

function getQuestionInstances (currentInstance, userData) {
  return jsonPath.query(currentInstance, '$..[?((@.name && @._type !== "checkbox") || @._type === "checkboxes")]')
    .filter(({ _type, _id }) => _type && _id)
    .filter(({ _type }) => _type !== 'button')
    .filter(({ $conditionalShow }) => { // NB. this mirrors the same check in process-input
      if ($conditionalShow) {
        return userData.evaluate($conditionalShow)
      }
      return true
    })
}

function getChangeAction (questionInstance, currentPage, currentInstance, userData, pageInstance) {
  return {
    actions: {
      items: [
        {
          href: getChangeHref(currentPage, currentInstance, userData, pageInstance),
          text: getChangeText(userData),
          visuallyHiddenText: getVisuallyHiddenText(questionInstance, userData)
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
function getChangeHref ({ params }, { _id }, { contentLang }, { url = '' }) {
  return `${getUrl(_id, params, contentLang)}/change${url}`
}

/*
 *  (userData)
 */
function getChangeText ({ contentLang }) {
  return contentLang === 'cy'
    ? 'Newid'
    : 'Change'
}

function getVisuallyHiddenText (questionInstance, userData) {
  const questionText = getQuestionText(questionInstance, userData)

  const {
    contentLang
  } = userData

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

function getAnswerBucketItem (questionInstance, { hideChangeAction = false }, currentPage, currentInstance, userData, pageInstance) {
  const { _id: currentInstanceId } = currentInstance
  const { name: questionName } = questionInstance
  const value = userData.getUserDataProperty(questionName)

  const controller = getComponentController(questionInstance)

  const questionText = getQuestionText(questionInstance, userData)
  const displayValue = controller.getDisplayValue(questionInstance, userData)
  const changeAction = ( // eslint-disable-line
    !hideChangeAction &&
    getChangeAction(questionInstance, currentPage, currentInstance, userData, pageInstance)
  )
  const answerKey = getAnswerKey(questionText)
  const answerValue = getAnswerValue(displayValue, value)

  return createAnswerBucketItem(
    currentInstanceId,
    questionName,
    answerKey,
    answerValue,
    changeAction)
}

function createAnswerBucket (answers = []) {
  const answerBucket = []

  answers.push({
    answers: answerBucket
  })

  return answerBucket
}

function getAnswerBucketItemForUpload (questionInstance, { hideChangeAction = false }, currentPage, currentInstance, userData, pageInstance) {
  const { _id: currentInstanceId } = currentInstance
  const { name: questionName } = questionInstance
  const acceptedFiles = (
    hasComponentAcceptedAnyFiles(questionInstance, userData)
      ? getComponentAcceptedFiles(questionInstance, userData)
      : []
  )
  const value = acceptedFiles.map(transformFile)
  const controller = getComponentController(questionInstance)

  const questionText = getQuestionText(questionInstance, userData)
  const displayValue = controller.getDisplayValue(questionInstance, userData)
  const changeAction = ( // eslint-disable-line
    !hideChangeAction &&
    getChangeAction(questionInstance, currentPage, currentInstance, userData, pageInstance)
  )
  const answerKey = getAnswerKey(questionText)
  const answerValue = getAnswerValue(displayValue, value)

  return createAnswerBucketItem(
    currentInstanceId,
    questionName,
    answerKey,
    answerValue,
    changeAction)
}

function getAnswerBucketItemForCheckbox (questionInstanceItem, questionInstance, { hideChangeAction = false }, currentPage, currentInstance, userData, pageInstance) {
  const { _id: currentInstanceId } = currentInstance
  const { name: questionName } = questionInstanceItem
  const value = userData.getUserDataProperty(questionName)

  const controller = getComponentController(questionInstance)

  const questionText = getQuestionText(questionInstance, userData)
  const displayValue = controller.getDisplayValueForItem(questionInstanceItem, userData)
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
    .filter(({ value = 'yes', name }) => value === userData.getUserDataInputProperty(name))
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

function populateParentAddableAnswers (questionInstance, answers, { _id }) {
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

function populateUploadAnswerBucket (answerBucket, ...args) {
  const answerBucketItem = getAnswerBucketItemForUpload(...args)

  answerBucket.push(answerBucketItem)
}

function populateDefaultAnswerBucket (answerBucket, ...args) {
  const answerBucketItem = getAnswerBucketItem(...args)

  answerBucket.push(answerBucketItem)
}

function populateAnswerBucket (answerBucket, questionInstance, ...args) {
  const { _type } = questionInstance

  switch (_type) {
    case 'checkboxes':
      populateCheckboxesAnswerBucket(answerBucket, questionInstance, ...args)
      break

    case 'upload':
      populateUploadAnswerBucket(answerBucket, questionInstance, ...args)
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
  createAnswerBucketItem,

  populateParentDeletableAnswers,
  populateParentAddableAnswers,
  populateParentRepeatableHeadingAnswers,
  populateRepeatableHeadingAnswers,
  populateStepAddAnswers,
  populateStepRemoveAnswers,

  populateAnswerBucket
}
