const jp = require('jsonpath')
const get = require('lodash.get')
const uuidv4 = require('uuid/v4')
const bytes = require('bytes')
const {default: produce} = require('immer')
const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {evaluateInput} = require('../../../../evaluate-condition/evaluate-condition')
const {getUrl} = require('../../../../route/route')

const CONSTANTS = require('../../../../constants/constants')
const {SERVICE_OUTPUT_EMAIL} = CONSTANTS

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
  setRepeatable
} = require('../../../../page/page')

const {format} = require('../../../../format/format')

const defaultRepeatableAdd = 'Add another'
const defaultRepeatableDelete = 'Remove'

const submitterClient = require('../../../../client/submitter/submitter')

const SummaryController = {}

SummaryController.setContents = (pageInstance, userData, res, skipActions) => {
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
        if (Number(currentInstanceCount) === Number(currentCount) && (!repeatableMaximum || repeatableMaximum > currentCount)) {
          stepAdd = {
            add: `${stepInstance._id}/${namePrefix}`,
            repeatableAdd
          }
        }
      }

      const sectionHeading = getInstanceProperty(stepInstance._id, ['sectionHeadingSummary', 'sectionHeading'])
      const previousSectionHeading = getInstanceProperty(previousInstance._id, ['sectionHeadingSummary', 'sectionHeading'])

      if (sectionHeading) {
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
          let {$conditionalShow} = nameInstance
          if ($conditionalShow) {
            return evaluateInput($conditionalShow, userData.getUserData())
          }
          return true
        })
      const isMultipleQuestions = names.length > 1

      let pageHeading = getInstanceTitleSummary(stepInstance._id)

      if (names.length) {
        if (!pageHeading) {
          let component = get(stepInstance, 'components[0]')
          if (component) {
            pageHeading = component.heading // getInstanceTitle(component._id)
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

        let question = getInstanceTitleSummary(_id)

        // TODO: update schema to mark as content
        question = format(question, userData.getUserData(), {lang: userData.contentLang})

        let answer = name ? userData.getUserDataProperty(name) : ''

        const componentController = getInstanceController(nameInstance)
        if (componentController.getDisplayValue) {
          answer = componentController.getDisplayValue(nameInstance, userData)
        }

        if (nameInstance._type === 'checkboxes') {
          if (nameInstance.items) {
            const values = nameInstance.items.filter(item => {
              let itemValue = item.value
              if (itemValue === undefined) {
                itemValue = 'yes'
              }
              return itemValue === userData.getUserDataProperty(item.name)
            }).map(item => {
              return getInstanceTitleSummary(item._id) || item.value
            })
            if (values.length === 0) {
              values.push('None')
            }
            answer = values.join('\n\n')
          }
        } else {
          if (nameInstance.items) {
            let nameItem = nameInstance.items.filter(item => item.value === answer)[0]
            answer = nameItem ? getInstanceTitleSummary(nameItem._id) : answer
          }
        }
        if (_type === 'fileupload') {
          if (Array.isArray(answer)) {
            answer = answer.map(a => {
              return `${a.originalname} (${bytes(a.size)})`
            }).join('\n\n')
          }
        }
        answer = answer || 'Not answered'
        if (Array.isArray(answer)) {
          answer = answer.join('\n\n')
        }
        const multiline = nameInstance.multiline || _type === 'fileupload' || _type === 'checkboxes'
        answer = format(answer, {}, {substitution: false, multiline, lang: userData.contentLang})

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
        if (skipActions) {
          delete answerBundle.actions
        }
        answerBucket.push(answerBundle)
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
  pageInstance = JSON.parse(JSON.stringify(pageInstance))
  return produce(pageInstance, draft => {
    draft.columns = 'full'
    draft.answers = answers
    return draft
  })
}

SummaryController.postValidation = async (pageInstance, userData) => {
  let submitForm
  const submissionId = uuidv4()
  const submissionDate = (new Date()).getTime()
  userData.setUserDataProperty('submissionId', submissionId)
  userData.setUserDataProperty('submissionDate', submissionDate)
  const params = userData.getUserParams()
  const nextPage = getNextPage({_id: pageInstance._id, params}, userData)
  if (nextPage) {
    const nextType = getInstanceProperty(nextPage._id, '_type')
    if (nextType === 'page.confirmation') {
      submitForm = true
    }
  }
  if (!submitForm) {
    return pageInstance
  }
  const {userId, userToken} = userData
  const formatEmail = (str, markdown = false) => {
    try {
      str = format(str, userData.getUserData(), {markdown, lang: userData.contentLang})
    } catch (e) {
      //
    }
    return str
  }
  if (submitterClient) {
    const submissions = []

    const serviceName = getInstanceProperty('service', 'name')
    let subject = getInstanceProperty('service', 'emailSubjectTeam') || `${serviceName} submission`
    subject = formatEmail(subject)
    const from = 'formbuilder@digital.justice.gov.uk'
    let to = SERVICE_OUTPUT_EMAIL || ''
    try {
      to = formatEmail(to)
    } catch (e) {
      //
    }
    let toTeamParts = to.split(/,\s*/)
    toTeamParts = toTeamParts.map(address => {
      address = address.trim()
      if (!address.match(/^e\[.+\]$/)) {
        return address
      }
      const addressLookup = address.replace(/^e\[(.+)\]$/, '$1')
      return CONSTANTS[addressLookup] || address
    })
      .filter(address => address)
      .map(address => address.split(/,\s*/))

    // flatten
    toTeamParts = [].concat(...toTeamParts)
    toTeamParts = [...new Set(toTeamParts)]

    // const timestamp = new Date().getTime()
    const emailUrlStub = '/api/submitter/email'
    const teamSubmission = {
      type: 'email',
      from,
      subject,
      body_parts: {
        'text/plain': `${emailUrlStub}/team`
      },
      attachments: [{
        url: `/api/submitter/pdf/default/${submissionId}.pdf`,
        filename: `${submissionId}.pdf`,
        mimetype: 'application/pdf',
        type: 'output'
      }]
    }

    const data = userData.getOutputData()
    let uploadedFiles = []
    const findUploadedFiles = (data) => {
      if (Array.isArray(data) || typeof data !== 'object') {
        return
      }
      Object.keys(data).forEach(key => {
        const arr = data[key]
        if (Array.isArray(arr)) {
          const actualFiles = arr.filter(item => {
            return item.fingerprint && item.url
          }).map(item => ({
            url: item.url,
            mimetype: item.mimetype,
            filename: item.originalname,
            type: 'filestore'
          }))
          uploadedFiles = uploadedFiles.concat(actualFiles)
        } else if (typeof arr === 'object') {
          findUploadedFiles(arr)
        }
      })
    }
    findUploadedFiles(data)
    uploadedFiles.forEach(upload => {
      teamSubmission.attachments.push(upload)
    })

    // TODO: set up alternative output formats
    // `/api/submitter/json/default/${submissionId}.json`,
    // `/api/submitter/csv/default/${submissionId}.csv`

    toTeamParts.forEach(to => {
      const toTeamSubmission = Object.assign({}, teamSubmission, {to})
      submissions.push(toTeamSubmission)
    })
    const emailUserInputName = getInstanceProperty('service', 'emailInputNameUser') || 'email'
    if (emailUserInputName) {
      const userEmail = userData.getUserDataProperty(emailUserInputName)
      if (userEmail) {
        const userSubmission = deepClone(teamSubmission)
        const userSubject = getInstanceProperty('service', 'emailSubjectUser') || `Your ${serviceName} submission`
        userSubmission.subject = formatEmail(userSubject)
        userSubmission['body_parts']['text/plain'] = `${emailUrlStub}/user`
        userSubmission.attachments.length = 1

        let toUserParts = userEmail.split(/,\s*/)
        toUserParts.forEach(to => {
          const toUserSubmission = Object.assign({}, userSubmission, {to})
          submissions.push(toUserSubmission)
        })
      }
    }

    try {
      await submitterClient.submit(userId, userToken, submissions)
    } catch (e) {
      // console.log('Something went boom', e)
    }
  }
  return pageInstance
}

module.exports = SummaryController
