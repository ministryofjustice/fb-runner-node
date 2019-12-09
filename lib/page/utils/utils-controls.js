const getNormalisedUploadControlName = (name = '') => name.replace(/\[\d+\]$/, '')

module.exports = {
  getNormalisedUploadControlName
}
