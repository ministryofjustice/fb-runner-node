const getUploadFileName = (controlName, count = 1) => `${controlName}[${count}]`
const getUploadControlName = (fileName = '') => fileName.replace(/\[\d+\]$/, '')

module.exports = {
  getUploadFileName,
  getUploadControlName
}
