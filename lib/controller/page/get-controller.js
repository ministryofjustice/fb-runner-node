require('@ministryofjustice/module-alias/register-module')(module)

/*
 *  Controllers are effectively singletons (instances are memoised
 *  to these scoped variables)
 */
let summaryController
let uploadCheckController
let uploadSummaryController
let commonController

/*
 *  There are circularities in the modules so the controllers are required
 *  at run-time (until I have addressed the circularities)
 */
function getSummaryController () {
  if (!summaryController) {
    const SummaryController = require('./type/page.summary')

    summaryController = new SummaryController()
  }

  return summaryController
}

function getUploadCheckController () {
  if (!uploadCheckController) {
    const UploadCheckController = require('./type/page.uploadCheck')

    uploadCheckController = new UploadCheckController()
  }

  return uploadCheckController
}

function getUploadSummaryController () {
  if (!uploadSummaryController) {
    const UploadSummaryController = require('./type/page.uploadSummary')

    uploadSummaryController = new UploadSummaryController()
  }

  return uploadSummaryController
}

function getCommonController () {
  if (!commonController) {
    const CommonController = require('./common')

    commonController = new CommonController()
  }

  return commonController
}

function getPageControllerByType (type) {
  switch (type) {
    case 'page.summary':
      return getSummaryController()

    case 'page.uploadCheck':
      return getUploadCheckController()

    case 'page.uploadSummary':
      return getUploadSummaryController()

    default:
      return getCommonController()
  }
}

module.exports = ({ _type }) => getPageControllerByType(_type)
