require('@ministryofjustice/module-alias/register-module')(module)

const metrics = require('~/fb-runner-node/middleware/metrics/metrics')
const prometheusClient = metrics.getClient()
const csrf = require('~/fb-runner-node/middleware/csrf/csrf')

const {getUploadControls} = require('~/fb-runner-node/page/utils/utils-uploads')

const getAllowedMOJUploadControls = require('./get-allowed-moj-upload-controls')
const processMOJUploadControls = require('./process-moj-upload-controls')
const processMOJUploadedFiles = require('./process-moj-uploaded-files')
const registerMOJUploadErrors = require('./register-moj-upload-errors')
const storeMOJUploadedFiles = require('./store-moj-uploaded-files')

// values for metrics
const labelNames = []
const buckets = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]

const processUploadsMetrics = new prometheusClient.Histogram({
  name: 'process_uploads_complete',
  help: 'Process file uploads for a request',
  labelNames,
  buckets
})

const uploadControlsMetrics = new prometheusClient.Histogram({
  name: 'process_uploads_get_upload_controls',
  help: 'Process file uploads for a request - determine upload controls for instance',
  labelNames,
  buckets
})

const allowedUploadControlsMetrics = new prometheusClient.Histogram({
  name: 'process_uploads_get_allowed_controls',
  help: 'Process file uploads for a request - determine allowed upload controls',
  labelNames,
  buckets
})

const processMOJUploadControlsMetrics = new prometheusClient.Histogram({
  name: 'process_uploads_process_controls',
  help: 'Process file uploads for a request - process upload controls',
  labelNames,
  buckets
})

const processMOJUploadedFilesMetrics = new prometheusClient.Histogram({
  name: 'process_uploads_process_uploaded_files',
  help: 'Process file uploads for a request - process uploaded files',
  labelNames,
  buckets
})

const storeMOJUploadedFilesMetrics = new prometheusClient.Histogram({
  name: 'process_uploads_store_uploaded_files',
  help: 'Process file uploads for a request - store uploaded files',
  labelNames,
  buckets
})

const registerMOJUploadErrorsMetrics = new prometheusClient.Histogram({
  name: 'process_uploads_register_upload_errors',
  help: 'Process file uploads for a request - register upload errors',
  labelNames,
  buckets
})

const processUploads = async (pageInstance, userData) => {
  const {req} = userData
  if (pageInstance.encType && req.method === 'POST') {
    // record complete process
    const endProcessUploadsMetrics = processUploadsMetrics.startTimer()

    const endUploadControlsMetrics = uploadControlsMetrics.startTimer()
    const uploadControls = getUploadControls(pageInstance)
    // .filter(({_type}) => _type === 'mojFileupload')

    endUploadControlsMetrics()

    const endAllowedUploadControlsMetrics = allowedUploadControlsMetrics.startTimer()
    const allowedUploadControls = getAllowedMOJUploadControls(userData, uploadControls)
    endAllowedUploadControlsMetrics()

    const endProcessUploadControlsMetrics = processMOJUploadControlsMetrics.startTimer()
    const processedResults = await processMOJUploadControls(userData, uploadControls, allowedUploadControls)
    endProcessUploadControlsMetrics()

    // only now has the multipart body been processed - check the csrf token
    try {
      const userId = userData.getUserId()
      const {_csrf} = userData.getBodyInput()
      await csrf.validateCsrf(_csrf, userId)
    } catch (err) {
      // stop recording complete process as it's aborted
      endProcessUploadsMetrics()
      throw err
    }

    const endProcessUploadedFilesMetrics = processMOJUploadedFilesMetrics.startTimer()
    const uploadResults = await processMOJUploadedFiles(processedResults, uploadControls)
    endProcessUploadedFilesMetrics()

    const endStoreUploadedFilesMetrics = storeMOJUploadedFilesMetrics.startTimer()
    const fileErrors = await storeMOJUploadedFiles(userData, uploadResults)
    endStoreUploadedFilesMetrics()

    const endRegisterUploadErrorsMetrics = registerMOJUploadErrorsMetrics.startTimer()
    pageInstance = registerMOJUploadErrors(pageInstance, userData, fileErrors)
    endRegisterUploadErrorsMetrics()

    // stop recording complete process
    endProcessUploadsMetrics()
  }
  return pageInstance
}

module.exports = processUploads
