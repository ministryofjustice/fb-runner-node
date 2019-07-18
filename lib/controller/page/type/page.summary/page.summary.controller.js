const metrics = require('../../../../middleware/metrics/metrics')
const prometheusClient = metrics.getClient()
const submissionFailureMetric = new prometheusClient.Counter({
  name: 'submission_failures',
  help: 'Counts number of submissions that failed to be queued'
})

const uuidv4 = require('uuid/v4')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const CONSTANTS = require('../../../../constants/constants')
const {SERVICE_OUTPUT_EMAIL} = CONSTANTS

const {
  getInstance,
  getInstanceProperty,
  getString
} = require('../../../../service-data/service-data')
const {
  getUrl,
  getNextPage
} = require('../../../../route/route')
const redirectNextPage = require('../../../../page/redirect-next-page/redirect-next-page')

const {format} = require('../../../../format/format')

const submitterClient = require('../../../../client/submitter/submitter')

const SummaryController = {}

const checkSubmits = (pageInstance, userData) => {
  const nextPage = getNextPage({_id: pageInstance._id, params: userData.getUserParams()}, userData)
  // Check page actually submits
  if (!nextPage) {
    return false
  }
  const nextType = getInstanceProperty(nextPage._id, '_type')
  return nextType === 'page.confirmation'
}

SummaryController.preFlight = async (pageInstance, userData) => {
  const performsSubmit = checkSubmits(pageInstance, userData)
  if (performsSubmit) {
    const currrentUrl = getUrl(pageInstance._id)
    // Check where we get if we replay from start page
    let reachedPageInstance = deepClone(getInstance('page.start'))
    reachedPageInstance.changepage = currrentUrl
    reachedPageInstance.$validated = true
    reachedPageInstance = await redirectNextPage(reachedPageInstance, userData)
    // Check made it back to the Check your answers page
    if (reachedPageInstance.redirect) {
      if (reachedPageInstance.redirect !== pageInstance._id && reachedPageInstance.redirect !== currrentUrl) {
        const redirectUrl = getUrl(reachedPageInstance.redirect, {}, userData.contentLang)
        pageInstance.redirect = redirectUrl
      }
    }
  }
  return pageInstance
}

SummaryController.setContents = (pageInstance, userData, res, hideChangeAction) => {
  pageInstance.components = pageInstance.components || []

  pageInstance.components.push({
    _id: 'page.summary.answers',
    _type: 'answers',
    hideChangeAction,
    onlyShowCompletedAnswers: false
  })

  return pageInstance
}

SummaryController.postValidation = async (pageInstance, userData) => {
  const performsSubmit = checkSubmits(pageInstance, userData)
  if (!performsSubmit) {
    return pageInstance
  }
  const submissionId = uuidv4()
  const submissionDate = (new Date()).getTime()
  userData.setUserDataProperty('submissionId', submissionId)
  userData.setUserDataProperty('submissionDate', submissionDate)
  const userId = userData.getUserId()
  const userToken = userData.getUserToken()
  const formatEmail = (str, markdown = false) => {
    try {
      str = format(str, userData.getScopedUserData(), {markdown, lang: userData.contentLang})
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
    const defaultEmailAddress = getString('email.address.from')
    const from = defaultEmailAddress ? formatEmail(defaultEmailAddress) : '"Form Builder" <form-builder@digital.justice.gov.uk>'
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
        'text/plain': `${emailUrlStub}/team/${submissionId}-team`
      },
      attachments: [{
        url: `/api/submitter/pdf/default/team/${submissionId}-team.pdf`,
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
        userSubmission['body_parts']['text/plain'] = `${emailUrlStub}/user/${submissionId}-user`
        userSubmission.attachments = [{
          url: `/api/submitter/pdf/default/user/receipt-${submissionId}.pdf`,
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
      await submitterClient.submit({userId, userToken, submissions}, userData.logger)
    } catch (error) {
      submissionFailureMetric.inc()
      if (userData.logger) {
        userData.logger.error({
          name: 'submission_failed',
          error
        }, 'Submission failed to be queued')
      }
      throw new Error('submission.failed')
    }
  }
  return pageInstance
}

module.exports = SummaryController
