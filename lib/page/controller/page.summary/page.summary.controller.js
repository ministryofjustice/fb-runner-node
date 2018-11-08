const jp = require('jsonpath')
const get = require('lodash.get')
const {default: produce} = require('immer')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const {SERVICETEAM_EMAIL} = require('../../../constants/constants')

const {
  getInstance,
  getInstanceTitle,
  getInstanceProperty,
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

const defaultRepeatableAdd = 'Add another'
const defaultRepeatableDelete = 'Remove'

const submitterClient = require('../../../client/submitter/submitter')

const SummaryController = {}

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
    if (stepInstance.heading) {
      stepInstance = produce(stepInstance, draft => {
        draft.heading = draft.heading.replace(/\[#(.*?)\]/g, (m, m1) => {
          if (nextPage.params && nextPage.params[m1] !== undefined) {
            return nextPage.params[m1]
          }
          return `[${m1}]`
        })
      })
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
        let currentInstanceCount
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
        // console.log({currentInstanceCount, currentCount, repeatableMaximum})
        if (Number(currentInstanceCount) === Number(currentCount) && (!repeatableMaximum || repeatableMaximum > currentCount)) {
          stepAdd = {
            add: `${stepInstance._id}/${namePrefix}`,
            repeatableAdd
          }
        }
      }
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
        // console.log('$count', nameInstance._id, nameInstance.name, nameInstance.$count, nameInstance.namePrefix)
        // answers.push({
        //   remove: `${namePrefix}=${currentInstanceCount}`,
        //   repeatableDelete
        // })
        // makeNewAnswerBucket()
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
        if (Array.isArray(answer)) {
          answer = answer.join('\n\n')
        }
        answer = format(answer, {substitution: false, multiline: nameInstance.multiline})

        answerBucket.push({
          page: stepInstance._id,
          component: name,
          question,
          answer,
          changeUrl: `${userData.pagesMethods.getUrl(stepInstance._id, nextPageParams)}/change${userData.url}`
        })
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
  pageInstance = produce(pageInstance, draft => {
    draft.columns = 'full'
    draft.answers = answers
    return draft
  })
  return pageInstance
}

SummaryController.postValidation = async (pageInstance, userData) => {
  let submitForm
  const params = userData.getUserParams()
  const nextPage = getNextPage({_id: pageInstance._id, params}, userData)
  if (nextPage) {
    const nextType = getInstanceProperty(nextPage._id, '_type')
    if (nextType === 'page.confirmation') {
      submitForm = true
    }
  }
  if (!submitForm) {
    return
  }
  const {userId, userToken} = userData
  const formatEmail = (str, markdown = false) => {
    try {
      str = format(str, userData.getUserData(), {markdown})
    } catch (e) {
      //
    }
    return str
  }
  if (submitterClient) {
    let subject = getInstanceProperty('service', 'emailTeamSubject') || '[Form Builder submission team subject]'
    subject = formatEmail(subject)
    const from = 'formbuilder@digital.justice.gov.uk'
    const to = SERVICETEAM_EMAIL || 'alex.robinson@digital.justice.gov.uk'
    const emailUrl = '/api/submitter/email/'
    const teamSubmission = {
      type: 'email',
      to,
      from,
      subject,
      body_parts: {
        'text/plain': `${emailUrl}team`
      },
      attachments: [
        '/api/submitter/pdf/default'
      ]
    }
    const submissions = [teamSubmission]
    const defaultCCAddress = getInstanceProperty('service', 'defaultCCAddress')
    if (defaultCCAddress) {
      const ccAddress = userData.getUserDataProperty(defaultCCAddress)
      if (ccAddress) {
        const citizenSubmission = deepClone(teamSubmission)
        const citizenSubject = getInstanceProperty('service', 'emailCitizenSubject') || '[Form Builder submission subject]'
        citizenSubmission.subject = formatEmail(citizenSubject)
        citizenSubmission.to = ccAddress
        citizenSubmission['body_parts']['text/plain'] = `${emailUrl}citizen`
        submissions.push(citizenSubmission)
      }
    }
    try {
      // const status =
      await submitterClient.submit(userId, userToken, submissions)
    } catch (e) {
      // console.log('Something went boom', e)
    }
  }
}

module.exports = SummaryController
