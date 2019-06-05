const uuidv4 = require('uuid/v4')
const {default: produce} = require('immer')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const CONSTANTS = require('../../../../constants/constants')
const {SERVICE_OUTPUT_EMAIL} = CONSTANTS

const {
  getInstanceProperty,
  getString
} = require('../../../../service-data/service-data')
const {
  getNextPage
} = require('../../../../route/route')

const {format} = require('../../../../format/format')

const submitterClient = require('../../../../client/submitter/submitter')

const SummaryController = {}

SummaryController.setContents = (pageInstance, userData, res, hideChangeAction) => {
  pageInstance = JSON.parse(JSON.stringify(pageInstance))
  pageInstance = produce(pageInstance, draft => {
    // draft.columns = 'full'
    draft.components = draft.components || []

    draft.components.push({
      _id: 'page.summary.answers',
      _type: 'answers',
      hideChangeAction,
      onlyShowCompletedAnswers: false
    })

    return draft
  })
  return pageInstance
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
  const userId = userData.getUserId()
  const userToken = userData.getUserToken()
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
    const from = getString('email.address.from') || 'formbuilder@digital.justice.gov.uk'
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
    const emailUrlStub = '/api/submitter/email/default'
    const teamSubmission = {
      type: 'email',
      from,
      subject,
      body_parts: {
        'text/plain': `${emailUrlStub}/team/${submissionId}`
      },
      attachments: [{
        url: `/api/submitter/pdf/default/team/${submissionId}.pdf`,
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
        userSubmission['body_parts']['text/plain'] = `${emailUrlStub}/user/${submissionId}`
        userSubmission.attachments = [{
          url: `/api/submitter/pdf/default/user/${submissionId}.pdf`,
          filename: `receipt-${submissionId}.pdf`,
          mimetype: 'application/pdf',
          type: 'output'
        }]

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
