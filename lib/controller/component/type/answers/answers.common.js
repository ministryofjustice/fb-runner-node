const jsonPath = require('jsonpath')
const striptags = require('striptags')

const {
  getUrl,
  getNextPage
} = require('../../../../route/route')

const {
  getDisplayValue
} = require('../../../../page/page')

const {format} = require('../../../../format/format')

const isCurrentPageInstance = ({_id: cid = 'cid'} = {}, {_id: pid = 'pid'} = {}) => cid === pid
const hasQuestions = (questionInstances = []) => questionInstances.length > 0
const hasMultipleQuestions = (questionInstances = []) => questionInstances.length > 1

function formatQuestion (userData, questionInstance) {
  const lang = userData.contentLang

  if (lang === 'cy') {
    return questionInstance['label:cy'] || questionInstance['legend:cy']
  }

  return questionInstance.label || questionInstance.legend
}

function formatHeading (userData, currentInstance) {
  const lang = userData.contentLang

  if (lang === 'cy') {
    return currentInstance['heading:cy']
  }

  return currentInstance.heading
}

function formatSectionHeading (userData, value, param = {}) {
  const scopedUserData = userData.getScopedUserData({param})

  return format(value, scopedUserData, {lang: userData.contentLang})
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
        }

        return true
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

function getAnswerKey (userData, questionInstance) {
  return {
    html: formatQuestion(userData, questionInstance)
  }
}

function getAnswerValue (pageInstance, userData, questionInstance) {
  const displayValue = getDisplayValue(pageInstance, userData, questionInstance)

  /*
   *  `String()` is safer than `toString` since some data types
   *  (such as undefined or null) do not have a `toString` method
   */
  const html = String(displayValue)
  const text = striptags(html)
  const {
    name
  } = questionInstance

  /*
   *  These fields are consumed in Nunjucks which
   *  expects strings
   */
  const value = {
    html,
    text
  }

  // handles checkboxes and other non-duck-typed objects
  try {
    const machine = userData.getUserDataProperty(name)
    value.machine = machine !== undefined && machine !== null
      ? machine
      : text
  } catch (e) {
    value.machine = text
  }

  return value
}

/*
 *  (currentPage, currentInstance, userData, pageInstance)
 */
function getChangeHref ({params}, {_id}, {contentLang}, {url}) {
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
  const formattedQuestion = formatQuestion(userData, questionInstance)

  return contentLang === 'cy'
    ? `your answer for ${formattedQuestion}` // TODO
    : `your answer for ${formattedQuestion}`
}

function createAnswerBucket (answers = []) {
  const answerBucket = []

  answers.push({
    answers: answerBucket
  })

  return answerBucket
}

module.exports = {
  isCurrentPageInstance,

  hasQuestions,
  hasMultipleQuestions,

  formatQuestion,
  formatHeading,
  formatSectionHeading,

  getSubsequentPage,

  getQuestionInstances,

  populateParentDeletableAnswers,
  populateParentAddableAnswers,
  populateParentRepeatableHeadingAnswers,
  populateRepeatableHeadingAnswers,
  populateStepAddAnswers,
  populateStepRemoveAnswers,

  getAnswerKey,
  getAnswerValue,
  getChangeHref,
  getChangeText,
  getVisuallyHiddenText,

  createAnswerBucket
}
