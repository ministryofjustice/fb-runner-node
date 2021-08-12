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
const log = debug('runner:page:summary:log')
const error = debug('runner:page:summary:error')

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

const {
  transformFile
} = require('~/fb-runner-node/page/utils/utils-uploads')

const { getUrl } = require('~/fb-runner-node/route/route')
const getRedirectForNextPage = require('~/fb-runner-node/page/redirect-next-page/redirect-next-page')
const { checkSubmits } = require('~/fb-runner-node/page/check-submits/check-submits')
const { pdfPayload } = require('~/fb-runner-node/presenter/pdf-payload')
const { submissionDataWithLabels } = require('~/fb-runner-node/presenter/submission-data-with-labels')
const { getComponentName } = require('~/fb-runner-node/page/utils/utils-controls')
const { format } = require('~/fb-runner-node/format/format')
const { generateEmail, composeEmailBody, emailTypes } = require('~/fb-runner-node/submission/submitter-payload')
const submitterClient = require('~/fb-runner-node/client/submitter/submitter')

function transformAcceptedForJson (accepted) {
  return accepted.reduce((accumulator, { fieldName }) => {
    const componentName = getComponentName(fieldName)

    if (Reflect.has(accumulator, componentName)) return accumulator

    return { ...accumulator, [componentName]: accepted.filter(({ fieldName }) => getComponentName(fieldName) === componentName).map(transformFile) }
  }, {})
}

function transformAcceptedForCsv (accepted) {
  return accepted.reduce((accumulator, { fieldName }) => {
    const componentName = getComponentName(fieldName)

    if (Reflect.has(accumulator, componentName)) return accumulator

    return { ...accumulator, [componentName]: 'data not available in CSV format' }
  }, {})
}

function reduceUploadComponentValuesForAcceptedFiles (acceptedFiles = {}) {
  return function reducer (accumulator, [key, value]) {
    /*
     *  Does the key belong to the upload component?
     */
    if (key.startsWith('upload-component-')) {
      /*
       *  Yes. Either:
       */
      if (key === 'upload-component-field-name') {
        /*
         *  Merge in the accepted files at this position
         */
        return { ...accumulator, ...acceptedFiles }
      }
      /*
       *  Or: ignore these fields entirely
       */
      return accumulator
    }
    /*
     *  No. Merge the key and value into the accumulator
     */
    return { ...accumulator, [key]: value }
  }
}

function removeUploadComponentValuesForJson ({ 'upload-component-accepted': accepted = [], ...values } = {}) {
  const acceptedFiles = transformAcceptedForJson(accepted)

  return (
    Object.entries(values)
      .reduce(reduceUploadComponentValuesForAcceptedFiles(acceptedFiles), {})
  )
}

function removeUploadComponentValuesForCsv ({ 'upload-component-accepted': accepted = [], ...values } = {}) {
  const acceptedFiles = transformAcceptedForCsv(accepted)

  return (
    Object.entries(values)
      .reduce(reduceUploadComponentValuesForAcceptedFiles(acceptedFiles), {})
  )
}

function removeUploadComponentValuesForEmail (values = {}) {
  return (
    Object.entries(values)
      .reduce((accumulator, [key, value]) => {
        if (key.startsWith('upload-component-')) {
          return accumulator
        } else {
          if ((value || false).constructor === Object) {
            return { ...accumulator, [key]: removeUploadComponentValuesForEmail(value) }
          } else {
            return { ...accumulator, [key]: value }
          }
        }
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
        const scopedUserData = removeUploadComponentValuesForEmail(userData.getScopedUserData())
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
    const emailFrom = defaultEmailAddress ? formatEmail(defaultEmailAddress) : '"MOJ Forms" <moj-forms@digital.justice.gov.uk>'
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

    const emailData = removeUploadComponentValuesForEmail(userData.getUserData())
    const emailBody = composeEmailBody(emailData, userData.contentLang, emailTypes.TEAM)
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
        const userSubject = getInstanceProperty('service', 'emailSubjectUser') || `Your ${serviceName} submission`
        const includePdf = getInstanceProperty('service', 'attachUserSubmission') || false

        const emailSubject = formatEmail(userSubject)
        const emailBody = composeEmailBody(emailData, userData.contentLang, emailTypes.USER)
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
        const scopedUserData = removeUploadComponentValuesForEmail(userData.getScopedUserData())
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
    const emailFrom = defaultEmailAddress ? formatEmail(defaultEmailAddress) : '"MOJ Forms" <moj-forms@digital.justice.gov.uk>'
    const emailTo = formatEmail(SERVICE_OUTPUT_EMAIL)

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

    toTeamParts.forEach((to) => {
      submissions.push(Object.assign({}, submission, { to }))
    })
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
        log('Submitting ...')

        await submitterClient.submit(submission, userId, userToken, userData.logger)

        log('... Done')
      } catch (e) {
        error(e)

        submissionFailureMetric.inc()
        if (userData.logger) {
          userData.logger.error({
            name: 'submission_failed',
            error: e
          }, 'Submission failed to be queued')
        }

        throw new Error('submission.failed')
      }
    }
    return pageInstance
  }
}
