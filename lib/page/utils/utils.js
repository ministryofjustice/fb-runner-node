const jp = require('jsonpath')

const getUploadControls = pageInstance => jp.query(pageInstance, '$..[?(@._type === "fileupload")]')

const getNormalisedUploadControlName = fieldname => fieldname.replace(/\[\d+\]$/, '')

module.exports = {
  getNormalisedUploadControlName,
  getUploadControls
}
