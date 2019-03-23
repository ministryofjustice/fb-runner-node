const getNormalisedUploadControlName = fieldname => fieldname.replace(/\[\d+\]$/, '')

module.exports = {
  getNormalisedUploadControlName
}
