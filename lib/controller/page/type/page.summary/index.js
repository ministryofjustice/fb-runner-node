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
const error = debug('runner:page:summary')

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
const { getComponentName } = require('~/fb-runner-node/page/utils/utils-controls')
const { format } = require('~/fb-runner-node/format/format')
const { generateEmail, composeEmailBody, emailTypes } = require('~/fb-runner-node/submission/submitter-payload')
const submitterClient = require('~/fb-runner-node/client/submitter/submitter')

const removeUploadComponentValuesForFile = (file) => (
  Object.fromEntries(
    Object.entries(file)
      .reduce((accumulator, [key, value]) => key === 'fieldName' ? accumulator.concat([['fieldname', value]]) : accumulator.concat([[key, value]]), [])
  )
)

function removeUploadComponentValuesForJson ({ 'upload-component-accepted': accepted = [], ...values } = {}) {
  return (
    Object.entries(values)
      .reduce((accumulator, [key, value]) => {
        if (key.startsWith('upload-component-')) {
          if (key === 'upload-component-field-name') {
            if (accepted.some(({ fieldName }) => fieldName === value)) {
              return { ...accumulator, [getComponentName(value)]: removeUploadComponentValuesForFile(accepted.find(({ fieldName }) => fieldName === value)) }
            }
          }

          return accumulator
        }

        return { ...accumulator, [key]: value }
      }, {})
  )
}

function removeUploadComponentValuesForCsv ({ 'upload-component-accepted': accepted = [], ...values } = {}) {
  return (
    Object.entries(values)
      .reduce((accumulator, [key, value]) => {
        if (key.startsWith('upload-component-')) {
          if (key === 'upload-component-field-name') {
            if (accepted.some(({ fieldName }) => fieldName === value)) {
              return { ...accumulator, [getComponentName(value)]: 'data not available in CSV format' }
            }
          }

          return accumulator
        }

        return { ...accumulator, [key]: value }
      }, {})
  )
}

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
        const scopedUserData = userData.getScopedUserData()
        str = format(str, scopedUserData, { markdown, lang: userData.contentLang })
      } catch (e) {
        error('Format email error (1) - continuing')
      }
      return str
    }

    const serviceName = getInstanceProperty('service', 'name')
    const emailSubject = formatEmail(
      getInstanceProperty('service', 'emailSubjectTeam') || `${serviceName} submission`
    )
    const defaultEmailAddress = getString('email.address.from')
    const emailFrom = defaultEmailAddress ? formatEmail(defaultEmailAddress) : '"Form Builder" <form-builder-team@digital.justice.gov.uk>'
    let emailTo = SERVICE_OUTPUT_EMAIL || ''

    try {
      emailTo = formatEmail(emailTo)
    } catch (e) {
      error('Format email error (2) - continuing')
    }

    let toTeamParts = emailTo.split(/,\s*/)

    toTeamParts = toTeamParts
      .map((address) => {
        address = address.trim()
        if (!address.match(/^e\[.+\]$/)) {
          return address
        }
        const addressLookup = address.replace(/^e\[(.+)\]$/, '$1')
        return CONSTANTS[addressLookup] || address
      })
      .filter((address) => address)
      .map((address) => address.split(/,\s*/))

    // flatten
    toTeamParts = [].concat(...toTeamParts)
    toTeamParts = [...new Set(toTeamParts)]

    const unscopedUserData = userData.getUserData()
    const emailBody = composeEmailBody(unscopedUserData, userData.contentLang, emailTypes.TEAM)
    const teamSubmission = generateEmail('team', emailFrom, emailSubject, submissionId, true, emailBody)
    const uploadedFiles = userData.uploadedFiles()

    uploadedFiles.forEach((upload) => {
      teamSubmission.attachments.push(upload)
    })

    toTeamParts.forEach((to) => {
      submissions.push(Object.assign({}, teamSubmission, { to }))
    })

    const emailUserInputName = getInstanceProperty('service', 'emailInputNameUser') || 'email'
    if (emailUserInputName) {
      const userEmail = userData.getUserDataProperty(emailUserInputName)
      if (userEmail) {
        const unscopedUserData = userData.getUserData()

        const userSubject = getInstanceProperty('service', 'emailSubjectUser') || `Your ${serviceName} submission`
        const includePdf = getInstanceProperty('service', 'attachUserSubmission') || false

        const emailSubject = formatEmail(userSubject)
        const emailBody = composeEmailBody(unscopedUserData, userData.contentLang, emailTypes.USER)
        const userSubmission = generateEmail('user', emailFrom, emailSubject, submissionId, includePdf, emailBody)
        const toUserParts = userEmail.split(/,\s*/)

        toUserParts.forEach((to) => {
          submissions.push(Object.assign({}, userSubmission, { to }))
        })
      }
    }
  }

  async generatePDFPayload (userData, submissionId) {
    const title = submissionId
    const heading = getInstanceProperty('service', 'pdfHeading')
    const subHeading = getInstanceProperty('service', 'pdfSubHeading')

    return (
      pdfPayload(
        await submissionDataWithLabels(title, heading, subHeading, userData)
      )
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
      user_answers: removeUploadComponentValuesForJson(userData.getOutputData()),
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
        const scopedUserData = userData.getScopedUserData()
        str = format(str, scopedUserData, { markdown, lang: userData.contentLang })
      } catch (e) {
        error('Format email error (3) - continuing')
      }
      return str
    }

    const serviceName = getInstanceProperty('service', 'name')
    const emailSubject = formatEmail(
      getInstanceProperty('service', 'emailSubjectTeam') || `${serviceName} submission`
    )
    const defaultEmailAddress = getString('email.address.from')
    const emailFrom = defaultEmailAddress ? formatEmail(defaultEmailAddress) : '"Form Builder" <form-builder-team@digital.justice.gov.uk>'
    const emailTo = formatEmail(SERVICE_OUTPUT_EMAIL)

    const submission = {
      type: 'csv',
      recipientType: 'team',
      from: emailFrom,
      to: emailTo,
      email_body: '',
      include_pdf: false,
      subject: emailSubject,
      include_attachments: true,
      user_answers: removeUploadComponentValuesForCsv(userData.getOutputData()),
      attachments: []
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

      const submission = {
        meta: {
          submission_id: submissionId,
          submission_at: submissionDate.toISOString()
        },
        submission: await this.generatePDFPayload(userData, submissionId),
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
