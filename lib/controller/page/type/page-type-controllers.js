
const pageSummary = require('./page.summary/page.summary.controller')
const pageConfirmation = require('./page.confirmation/page.confirmation.controller')
const pageUploadCheck = require('./page.uploadCheck/page.uploadCheck.controller')
const pageUploadSummary = require('./page.uploadSummary/page.uploadSummary.controller')

module.exports = {
  'page.summary': pageSummary,
  'page.confirmation': pageConfirmation,
  'page.uploadCheck': pageUploadCheck,
  'page.uploadSummary': pageUploadSummary
}
