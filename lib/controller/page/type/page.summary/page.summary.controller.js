require('@ministryofjustice/module-alias/register-module')(module)

const metrics = require('~/fb-runner-node/middleware/metrics/metrics')
const prometheusClient = metrics.getClient()
const submissionFailureMetric = new prometheusClient.Counter({
  name: 'submission_failures',
  help: 'Counts number of submissions that failed to be queued'
})

const uuidv4 = require('uuid/v4')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const CONSTANTS = require('~/fb-runner-node/constants/constants')
const {
  SERVICE_OUTPUT_EMAIL,
  SERVICE_OUTPUT_JSON_ENDPOINT,
  SERVICE_OUTPUT_JSON_KEY
} = CONSTANTS

const {
  getInstance,
  getInstanceProperty,
  getString
} = require('~/fb-runner-node/service-data/service-data')
const {getUrl} = require('~/fb-runner-node/route/route')
const redirectNextPage = require('~/fb-runner-node/page/redirect-next-page/redirect-next-page')
const {checkSubmits} = require('~/fb-runner-node/page/check-submits/check-submits')
const {pdfPayload} = require('~/fb-runner-node/presenter/pdf-payload')
const {submissionDataWithLabels} = require('~/fb-runner-node/presenter/submission-data-with-labels')

const {format} = require('~/fb-runner-node/format/format')

const {generateEmail, composeEmailBody, emailTypes} = require('~/fb-runner-node/submission/submitter-payload')

const submitterClient = require('~/fb-runner-node/client/submitter/submitter')

const SummaryController = {}

SummaryController.preFlight = async (instance, userData) => {
  const pageInstance = instance
  const performsSubmit = checkSubmits(pageInstance, userData)
  if (performsSubmit) {
    const currrentUrl = getUrl(pageInstance._id, {}, userData.contentLang)
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

SummaryController.attachEmailSubmissions = async (submissionId, userData, submissions) => {
  const formatEmail = (str, markdown = false) => {
    try {
      str = format(str, userData.getScopedUserData(), {markdown, lang: userData.contentLang})
    } catch (e) {
      //
    }
    return str
  }
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
  const emailBody = composeEmailBody(userData.getUserData(), userData.contentLang, emailTypes.TEAM)
  const teamSubmission = generateEmail('team', from, subject, submissionId, true, emailBody)

  const uploadedFiles = userData.uploadedFiles()
  uploadedFiles.forEach(upload => {
    teamSubmission.attachments.push(upload)
  })

  toTeamParts.forEach(to => {
    const toTeamSubmission = Object.assign({}, teamSubmission, {to})
    submissions.push(toTeamSubmission)
  })
  const emailUserInputName = getInstanceProperty('service', 'emailInputNameUser') || 'email'
  if (emailUserInputName) {
    const userEmail = userData.getUserDataProperty(emailUserInputName)
    if (userEmail) {
      const userSubject = getInstanceProperty('service', 'emailSubjectUser') || `Your ${serviceName} submission`
      const subject = formatEmail(userSubject)
      const includePdf = getInstanceProperty('service', 'attachUserSubmission') || false
      const emailBody = composeEmailBody(userData.getUserData(), userData.contentLang, emailTypes.USER)
      const userSubmission = generateEmail('user', from, subject, submissionId, includePdf, emailBody)

      const toUserParts = userEmail.split(/,\s*/)
      toUserParts.forEach(to => {
        const toUserSubmission = Object.assign({}, userSubmission, {to})
        submissions.push(toUserSubmission)
      })
    }
  }
}

SummaryController.generatePDFPayload = (userData, submissionId) => {
  const title = submissionId
  const heading = getInstanceProperty('service', 'pdfHeading')
  const subHeading = getInstanceProperty('service', 'pdfSubHeading')

  return pdfPayload(
    submissionDataWithLabels(title, heading, subHeading, userData)
  )
}

SummaryController.attachJsonSubmission = async (submissions, userData) => {
  if (SERVICE_OUTPUT_JSON_ENDPOINT === undefined) {
    return
  }

  const submission = {
    type: 'json',
    url: SERVICE_OUTPUT_JSON_ENDPOINT,
    encryption_key: SERVICE_OUTPUT_JSON_KEY,
    user_answers: userData.getOutputData(),
    attachments: userData.uploadedFiles()
  }

  submissions.push(submission)
}

SummaryController.attachCsvSubmission = async (submissions, userData) => {
  function formatEmail (str, markdown = false) {
    try {
      str = format(str, userData.getScopedUserData(), {markdown, lang: userData.contentLang})
    } catch (e) {
      //
    }
    return str
  }

  const serviceName = getInstanceProperty('service', 'name')
  const subject = formatEmail(
    getInstanceProperty('service', 'emailSubjectTeam') || `${serviceName} submission`
  )
  const defaultEmailAddress = getString('email.address.from')
  const from = defaultEmailAddress ? formatEmail(defaultEmailAddress) : '"Form Builder" <form-builder@digital.justice.gov.uk>'
  const to = formatEmail(SERVICE_OUTPUT_EMAIL)

  const submission = {
    type: 'csv',
    recipientType: 'team',
    from: from,
    to: to,
    email_body: '',
    include_pdf: false,
    subject: subject,
    include_attachments: true,
    attachments: [],
    user_answers: userData.getOutputData()
  }

  submissions.push(submission)
}

SummaryController.postValidation = async (pageInstance, userData) => {
  const performsSubmit = checkSubmits(pageInstance, userData)
  if (!performsSubmit) {
    return pageInstance
  }
  const submissionId = uuidv4()
  const submissionDate = new Date().getTime()
  userData.setUserDataProperty('submissionId', submissionId)
  userData.setUserDataProperty('submissionDate', submissionDate)
  const userId = userData.getUserId()
  const userToken = userData.getUserToken()
  if (submitterClient) {
    const submissions = []

    SummaryController.attachEmailSubmissions(submissionId, userData, submissions)
    SummaryController.attachJsonSubmission(submissions, userData)
    SummaryController.attachCsvSubmission(submissions, userData)

    const formData = SummaryController.generatePDFPayload(userData, submissionId)

    const submission = {
      submission: formData,
      actions: submissions,
      attachments: userData.uploadedFiles()
    }

    try {
      await submitterClient.submit(submission, userId, userToken, userData.logger)
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
