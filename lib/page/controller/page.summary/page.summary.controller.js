const SummaryController = {}
const jp = require('jsonpath')
const get = require('lodash.get')
const {default: produce} = require('immer')

const {
  getInstance,
  getInstanceTitle,
  getInstanceByPropertyValue
} = require('../../../service-data/service-data')
const {
  getNextPage
} = require('../../../route/route')

const components = require('../../component/component')
const skipPage = require('../../skip-page/skip-page')
const setControlNames = require('../../set-control-names/set-control-names')
const skipComponents = require('../../skip-components/skip-components')
const setRepeatable = require('../../set-repeatable/set-repeatable')

const {format} = require('../../../format/format')

SummaryController.setContents = (pageInstance, userData) => {
  let answers = []
  let answerBucket
  const makeNewAnswerBucket = () => {
    const newAnswers = []
    answers.push({
      answers: newAnswers
    })
    answerBucket = newAnswers
  }
  makeNewAnswerBucket()
  let nextPage
  if (pageInstance.summaryOf) {
    nextPage = {
      _id: pageInstance.summaryOf,
      params: {}
    }
    nextPage = getNextPage(nextPage, userData)
  } else {
    nextPage = {
      _id: getInstanceByPropertyValue('url', '/')._id
    }
  }
  if (nextPage._id === pageInstance._id) {
    nextPage = undefined
  }

  let previousInstance = {}
  while (nextPage) {
    let level = 2
    let nextPageId = nextPage._id
    let nextPageParams = nextPage.params
    let stepInstance = getInstance(nextPageId)
    if (stepInstance.namePrefix) {
      let namePrefix = format(stepInstance.namePrefix, nextPageParams, {markdown: false})
      stepInstance = produce(stepInstance, draft => {
        draft.namePrefix = namePrefix
        return draft
      })
    }
    stepInstance = skipPage(stepInstance, userData)
    stepInstance = setControlNames(stepInstance, userData)
    stepInstance = setRepeatable(stepInstance, userData)

    if (!stepInstance.$skipPage) {
      stepInstance = skipComponents(stepInstance, userData)
      if (stepInstance.sectionHeading) {
        if (stepInstance.sectionHeading !== previousInstance.sectionHeading) {
          answers.push({
            heading: stepInstance.sectionHeading,
            level
          })
          makeNewAnswerBucket()
        }
        level++
      }
      if (previousInstance.sectionHeading && !stepInstance.sectionHeading) {
        makeNewAnswerBucket()
      }
      const names = jp.query(stepInstance, '$..[?((@.name && @._type !== "checkbox") || @._type === "checkboxes")]')
        .filter(instance => instance._type && instance._id)
        .filter(instance => instance._type !== 'button')
      const isMultipleQuestions = names.length > 1
      let pageHeading = stepInstance.heading
      if (names.length) {
        if (!pageHeading) {
          let component = get(stepInstance, 'components[0]')
          if (component) {
            pageHeading = component.heading// getInstanceTitle(component._id)
          }
        }
        if (pageHeading) {
          const pageAnswers = {
            heading: pageHeading,
            level: level++
          }
          answers.push(pageAnswers)
          makeNewAnswerBucket()
        }
      }
      names.forEach(nameInstance => {
        if (nameInstance.$parentRepeatableHeading) {
          answers.push({
            heading: nameInstance.$parentRepeatableHeading,
            level
          })
          makeNewAnswerBucket()
        }
        if (nameInstance.$count === 1) {
          if (nameInstance.repeatable) {
            if (nameInstance.repeatableHeading) {
              if (pageHeading !== nameInstance.repeatableHeading) {
                answers.push({
                  heading: nameInstance.repeatableHeading,
                  level: level + 1
                })
              }
              makeNewAnswerBucket()
            }
          }
        }
        const {_id, _type, name} = nameInstance
        const question = nameInstance.legend || nameInstance.label || getInstanceTitle(_id)
        let answer = name ? userData.getUserDataProperty(name) : ''
        if (components[_type] && components[_type].getDisplayValue) {
          answer = components[_type].getDisplayValue(nameInstance, userData)
        }
        if (nameInstance._type === 'checkboxes') {
          if (nameInstance.items) {
            const values = nameInstance.items.filter(item => {
              return item.value === userData.getUserDataProperty(item.name)
            }).map(item => {
              return getInstanceTitle(item._id) || item.value
            })
            values.shift()
            if (values.length === 0) {
              values.push('None')
            }
            answer = values.join('\n\n')
          }
        } else {
          if (nameInstance.items) {
            let nameItem = nameInstance.items.filter(item => item.value === answer)[0]
            answer = nameItem ? getInstanceTitle(nameItem._id) : answer
          }
        }
        answer = answer || 'Not answered'
        answer = format(answer, {substitution: false, multiline: nameInstance.multiline})

        answerBucket.push({
          page: stepInstance._id,
          component: name,
          question,
          answer,
          changeUrl: `${userData.pagesMethods.getUrl(stepInstance._id, nextPageParams)}/change${userData.url}`
        })
      })
      if (isMultipleQuestions) {
        makeNewAnswerBucket()
      }
    }
    nextPage = getNextPage(nextPage, userData)
    if (nextPage) {
      nextPageId = nextPage._id
    }
    if (nextPageId === pageInstance._id) {
      nextPage = undefined
    }
    previousInstance = stepInstance
  }
  answers = answers.filter(item => {
    return !item.answers || item.answers.length
  })
  pageInstance = produce(pageInstance, draft => {
    draft.columns = 'full'
    draft.answers = answers
    return draft
  })
  return pageInstance
}

module.exports = SummaryController
