require('@ministryofjustice/module-alias/register-module')(module)

const CommonController = require('~/fb-runner-node/controller/page/common')

const metrics = require('~/fb-runner-node/middleware/metrics/metrics')
const prometheusClient = metrics.getClient()
const submissionFailureMetric = new prometheusClient.Counter({
  name: 'submission_failures',
  help: 'Counts number of submissions that failed to be queued'
})

const uuid = require('uuid')
const cloneDeep = require('lodash.clonedeep')

const debug = require('debug')
const error = debug('runner:summary-controller')

const CONSTANTS = require('~/fb-runner-node/constants/constants')
const {
  SERVICE_OUTPUT_EMAIL,
  SERVICE_OUTPUT_JSON_ENDPOINT,
  SERVICE_OUTPUT_JSON_KEY,
  SERVICE_OUTPUT_CSV
} = CONSTANTS

const {
  getInstance,
  getInstanceProperty,
  getString
} = require('~/fb-runner-node/service-data/service-data')
const { getUrl } = require('~/fb-runner-node/route/route')
const getRedirectForNextPage = require('~/fb-runner-node/page/redirect-next-page/redirect-next-page')
const { checkSubmits } = require('~/fb-runner-node/page/check-submits/check-submits')
const { pdfPayload } = require('~/fb-runner-node/presenter/pdf-payload')
const { submissionDataWithLabels } = require('~/fb-runner-node/presenter/submission-data-with-labels')

const { format } = require('~/fb-runner-node/format/format')

const { generateEmail, composeEmailBody, emailTypes } = require('~/fb-runner-node/submission/submitter-payload')

const submitterClient = require('~/fb-runner-node/client/submitter/submitter')

module.exports = class SummaryController extends CommonController {
  async preFlight (pageInstance, userData) {
    const performsSubmit = checkSubmits(pageInstance, userData)

    if (performsSubmit) {
      const {
        _id,
        _parent = 'page.start'
      } = pageInstance

      const currrentUrl = getUrl(_id, {}, userData.contentLang)

      const entryPageInstance = cloneDeep(getInstance(_parent))
      entryPageInstance.changePage = currrentUrl
      entryPageInstance.$validated = true

      const {
        redirect
      } = await getRedirectForNextPage(entryPageInstance, userData)

      if (redirect) {
        const redirectUrl = getUrl(redirect, {}, userData.contentLang)

        if (redirectUrl !== currrentUrl) {
          pageInstance.redirect = redirectUrl // eslint-disable-line
        }
      }
    }

    return pageInstance
  }

  setContents (pageInstance, userData) {
    const {
      components = []
    } = pageInstance

    pageInstance.components = components.concat({
      _id: 'page.summary.answers',
      _type: 'answers',
      hideChangeAction: false,
      onlyShowCompletedAnswers: false
    })

    return pageInstance
  }

  async attachEmailSubmissions (submissionId, userData, submissions) {
    function formatEmail (str, markdown = false) {
      try {
        str = format(str, userData.getScopedUserData(), { markdown, lang: userData.contentLang })
      } catch (e) {
        error('Format email error (1) - continuing')
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
      error('Format email error (2) - continuing')
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
      const toTeamSubmission = Object.assign({}, teamSubmission, { to })
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
          const toUserSubmission = Object.assign({}, userSubmission, { to })
          submissions.push(toUserSubmission)
        })
      }
    }
  }

  async generatePDFPayload (userData, submissionId) {
    const title = submissionId
    const heading = getInstanceProperty('service', 'pdfHeading')
    const subHeading = getInstanceProperty('service', 'pdfSubHeading')

    return pdfPayload(
      await submissionDataWithLabels(title, heading, subHeading, userData)
    )
  }

  async attachJsonSubmission (submissions, userData) {
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

  async attachCsvSubmission (submissions, userData) {
    if (SERVICE_OUTPUT_CSV === undefined) {
      return
    }

    function formatEmail (str, markdown = false) {
      try {
        str = format(str, userData.getScopedUserData(), { markdown, lang: userData.contentLang })
      } catch (e) {
        error('Format email error (3) - continuing')
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

  async postValidation (pageInstance, userData) {
    const performsSubmit = checkSubmits(pageInstance, userData)
    if (!performsSubmit) {
      return pageInstance
    }
    const submissionId = uuid.v4()
    const submissionDate = new Date()
    userData.setUserDataProperty('submissionId', submissionId)
    userData.setUserDataProperty('submissionDate', submissionDate.getTime())
    const userId = userData.getUserId()
    const userToken = userData.getUserToken()
    if (submitterClient) {
      const submissions = []

      await this.attachEmailSubmissions(submissionId, userData, submissions)
      await this.attachJsonSubmission(submissions, userData)
      await this.attachCsvSubmission(submissions, userData)

      const formData = await this.generatePDFPayload(userData, submissionId)

      const submission = {
        meta: {
          submission_id: submissionId,
          submission_at: submissionDate.toISOString()
        },
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
}
