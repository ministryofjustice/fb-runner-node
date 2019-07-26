const metrics = require('../../middleware/metrics/metrics')
const prometheusClient = metrics.getClient()
const csrf = require('../../middleware/csrf/csrf')

const {getUploadControls} = require('../utils/utils-uploads')

const getAllowedUploadControls = require('./get-allowed-upload-controls')
const processUploadControls = require('./process-upload-controls')
const processUploadedFiles = require('./process-uploaded-files')
const registerUploadErrors = require('./register-upload-errors')
const storeUploadedFiles = require('./store-uploaded-files')

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

const processUploadControlsMetrics = new prometheusClient.Histogram({
  name: 'process_uploads_process_controls',
  help: 'Process file uploads for a request - process upload controls',
  labelNames,
  buckets
})

const processUploadedFilesMetrics = new prometheusClient.Histogram({
  name: 'process_uploads_process_uploaded_files',
  help: 'Process file uploads for a request - process uploaded files',
  labelNames,
  buckets
})

const storeUploadedFilesMetrics = new prometheusClient.Histogram({
  name: 'process_uploads_store_uploaded_files',
  help: 'Process file uploads for a request - store uploaded files',
  labelNames,
  buckets
})

const registerUploadErrorsMetrics = new prometheusClient.Histogram({
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
    endUploadControlsMetrics()

    const endAllowedUploadControlsMetrics = allowedUploadControlsMetrics.startTimer()
    const allowedUploadControls = getAllowedUploadControls(userData, uploadControls)
    endAllowedUploadControlsMetrics()

    const endProcessUploadControlsMetrics = processUploadControlsMetrics.startTimer()
    const processedResults = await processUploadControls(userData, uploadControls, allowedUploadControls)
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

    const endProcessUploadedFilesMetrics = processUploadedFilesMetrics.startTimer()
    const uploadResults = await processUploadedFiles(processedResults, uploadControls)
    endProcessUploadedFilesMetrics()

    const endStoreUploadedFilesMetrics = storeUploadedFilesMetrics.startTimer()
    const fileErrors = await storeUploadedFiles(userData, uploadResults)
    endStoreUploadedFilesMetrics()

    const endRegisterUploadErrorsMetrics = registerUploadErrorsMetrics.startTimer()
    pageInstance = registerUploadErrors(pageInstance, userData, fileErrors)
    endRegisterUploadErrorsMetrics()

    // stop recording complete process
    endProcessUploadsMetrics()
  }
  return pageInstance
}

module.exports = processUploads
