const jp = require('jsonpath')
const get = require('lodash.get')
const bytes = require('bytes')
const {getUrl} = require('../../../../route/route')

const {
  getInstance,
  getInstanceTitleSummary,
  getInstanceProperty,
  getInstanceByPropertyValue
} = require('../../../../service-data/service-data')
const {
  getNextPage
} = require('../../../../route/route')

const {getInstanceController} = require('../../../controller')

const {
  skipPage,
  setControlNames,
  skipComponents,
  setRepeatable,
  updateControlNames
} = require('../../../../page/page')

const {getRedactedValue} = updateControlNames

const {format} = require('../../../../format/format')

const defaultRepeatableAdd = 'Add another'
const defaultRepeatableDelete = 'Remove'

const answersComponent = {
  removeUnnecessaryHeadings (answers) {
    return answers.reduce((ongoingAnswers, currentItem, currentIndex) => {
      if (currentItem.heading) {
        // Skip trailing headers
        if (currentIndex + 1 === answers.length) {
          return ongoingAnswers
        }

        const previousItem = ongoingAnswers[ongoingAnswers.length - 1]

        if (previousItem && previousItem.level === currentItem.level) {
          ongoingAnswers.pop()
        }
      }

      ongoingAnswers.push(currentItem)
      return ongoingAnswers
    }, [])
  }
}

answersComponent.preUpdateContents = (componentInstance, userData, pageInstance) => {
  const parsedComponentInstance = JSON.parse(JSON.stringify(componentInstance))
  const hideChangeAction = parsedComponentInstance.hideChangeAction
  const onlyShowCompletedAnswers = parsedComponentInstance.onlyShowCompletedAnswers

  const formatAnswersValue = (value, param = {}) => {
    const answersUserData = userData.getScopedUserData({param})
    return format(value, answersUserData, {lang: userData.contentLang})
  }

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
    const nextPageParams = nextPage.params
    let stepInstance = getInstance(nextPageId)
    if (stepInstance.namePrefix) {
      const namePrefix = format(stepInstance.namePrefix, nextPageParams, {markdown: false})
      stepInstance.namePrefix = namePrefix
    }
    if (stepInstance.heading) {
      stepInstance.heading = formatAnswersValue(stepInstance.heading, nextPage.params)
    }
    stepInstance = skipPage(stepInstance, userData)
    stepInstance = setControlNames(stepInstance, userData)
    stepInstance = setRepeatable(stepInstance, userData)

    if (!stepInstance.$skipPage) {
      stepInstance = skipComponents(stepInstance, userData)
      let stepAdd
      if (stepInstance.repeatable) {
        let {namePrefix, repeatableMinimum, repeatableMaximum, repeatableAdd, repeatableDelete} = stepInstance
        repeatableAdd = repeatableAdd || defaultRepeatableAdd
        repeatableDelete = repeatableDelete || defaultRepeatableDelete
        if (repeatableMinimum === undefined) {
          repeatableMinimum = 1
        }
        let currentInstanceCount = 1
        namePrefix = namePrefix.replace(/\[(\d+)\]$/, (m, m1) => {
          currentInstanceCount = m1
          return ''
        })
        let currentCount = (userData.getUserCountProperty(namePrefix) || {}).current
        if (currentCount === undefined) {
          currentCount = 1
        }
        if (currentCount > repeatableMinimum) {
          answers.push({
            remove: `${namePrefix}=${currentInstanceCount}`,
            repeatableDelete
          })
          makeNewAnswerBucket()
        }
        if (Number(currentInstanceCount) === Number(currentCount) && (!repeatableMaximum || repeatableMaximum > currentCount)) {
          stepAdd = {
            add: `${stepInstance._id}/${namePrefix}`,
            repeatableAdd
          }
        }
      }

      let sectionHeading = getInstanceProperty(stepInstance._id, ['sectionHeadingSummary', 'sectionHeading'])
      let previousSectionHeading = getInstanceProperty(previousInstance._id, ['sectionHeadingSummary', 'sectionHeading'])

      if (sectionHeading) {
        sectionHeading = formatAnswersValue(sectionHeading, stepInstance.params)
        previousSectionHeading = formatAnswersValue(previousSectionHeading, previousInstance.params)

        if (sectionHeading !== previousSectionHeading) {
          answers.push({
            heading: sectionHeading,
            level
          })
          makeNewAnswerBucket()
        }
        level++
      }

      if (previousSectionHeading && !sectionHeading) {
        makeNewAnswerBucket()
      }

      const names = jp.query(stepInstance, '$..[?((@.name && @._type !== "checkbox") || @._type === "checkboxes")]')
        .filter(instance => instance._type && instance._id)
        .filter(instance => instance._type !== 'button')
        .filter(nameInstance => {
          // NB. this mirrors the same check in process-input
          const {$conditionalShow} = nameInstance
          if ($conditionalShow) {
            return userData.evaluate($conditionalShow)
          }
          return true
        })
      const isMultipleQuestions = names.length > 1

      let pageHeading = getInstanceTitleSummary(stepInstance._id)

      if (names.length) {
        if (!pageHeading) {
          const component = get(stepInstance, 'components[0]')
          if (component) {
            pageHeading = component.heading // getInstanceTitle(component._id)
          }
        }
        // TODO: handle multi-question pages with one question and a visually hidden label
        if (stepInstance._type === 'page.singlequestion') {
          pageHeading = undefined
        }
        if (pageHeading) {
          pageHeading = formatAnswersValue(pageHeading, nextPageParams)
          const pageAnswers = {
            heading: pageHeading,
            repeatable: stepInstance.repeatable,
            level: level++
          }
          answers.push(pageAnswers)
          makeNewAnswerBucket()
        }
      }
      names.forEach(nameInstance => {
        if (nameInstance.$parentDeletable) {
          answers.push({
            remove: nameInstance.$parentDeleteValue,
            repeatableDelete: nameInstance.$parentRepeatableDelete
          })
          makeNewAnswerBucket()
        }
        if (nameInstance.$parentRepeatableHeading) {
          answers.push({
            heading: nameInstance.$parentRepeatableHeading,
            repeatable: true,
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
        const {_id, _type, name, $originalId} = nameInstance

        let question = getInstanceTitleSummary($originalId || _id)

        // TODO: update schema to mark as content
        question = formatAnswersValue(question, nextPageParams)

        let answer = name ? getRedactedValue(nameInstance, userData, pageInstance.skipRedact) : ''

        const componentController = getInstanceController(nameInstance)
        if (componentController.getDisplayValue) {
          answer = componentController.getDisplayValue(nameInstance, userData)
        }

        let substitution
        let markdown
        if (nameInstance._type === 'checkboxes') {
          if (nameInstance.items) {
            const values = nameInstance.items.filter(item => {
              let itemValue = item.value
              if (itemValue === undefined) {
                itemValue = 'yes'
              }
              return itemValue === userData.getUserDataInputProperty(item.name, null)
            }).map(item => {
              return getInstanceTitleSummary(item._id) || item.value
            })
            if (values.length === 0) {
              values.push('None')
            }
            answer = values.join('\n\n')
            substitution = true
          }
        } else {
          if (nameInstance.items) {
            const nameItem = nameInstance.items.filter(item => item.value === answer)[0]
            answer = nameItem ? getInstanceTitleSummary(nameItem._id) : answer
            if (nameItem) {
              substitution = true
            }
          }
        }
        if (_type === 'fileupload') {
          if (Array.isArray(answer)) {
            answer = answer.map(a => {
              return `${a.originalname} (${bytes(a.size)})`
            }).join('\n\n')
            markdown = true
          }
        }

        const unansweredQuestion = !answer

        if (unansweredQuestion) {
          answer = 'Not answered'
        }

        if (Array.isArray(answer)) {
          answer = answer.join('\n\n')
          markdown = true
        }
        const multiline = nameInstance.multiline || _type === 'fileupload' || _type === 'checkboxes'
        // TODO: check whether the lang property serve any purpose?
        if (substitution || markdown || multiline) {
          answer = format(answer, {}, {substitution, multiline, lang: userData.contentLang})
          if (answer) {
            answer = answer.replace(/&amp;/g, '&')
          }
        }

        const value = {}
        if (multiline) {
          value.html = answer
        } else {
          value.text = answer
        }

        const answerBundle = {
          page: stepInstance._id,
          component: name,
          key: {
            html: question
          },
          value,
          actions: {
            items: [
              {
                href: `${getUrl(stepInstance._id, nextPageParams, userData.contentLang)}/change${pageInstance.url}`,
                text: 'Change',
                visuallyHiddenText: `your answer for ${question}`
              }
            ]
          }
        }
        if (hideChangeAction) {
          delete answerBundle.actions
        }

        if (onlyShowCompletedAnswers) {
          if (!unansweredQuestion) {
            answerBucket.push(answerBundle)
          }
        } else {
          answerBucket.push(answerBundle)
        }
        // }
        // #${nameInstance._id}
        // Chrome has a bug that once an anchor is in place, it refuses to go away on redirect

        if (nameInstance.$parentAddable) {
          // answerBucket ?
          answers.push({
            add: `${stepInstance._id}/${nameInstance.$parentAddValue}`,
            repeatableAdd: nameInstance.$parentRepeatableAdd
          })
          makeNewAnswerBucket()
        }
      })
      if (stepAdd) {
        answers.push(stepAdd)
        makeNewAnswerBucket()
      }
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

  if (onlyShowCompletedAnswers) {
    answers = answersComponent.removeUnnecessaryHeadings(answers)
  }

  componentInstance.answers = answers

  return componentInstance
}

module.exports = answersComponent
