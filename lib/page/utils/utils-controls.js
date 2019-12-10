const getUploadFieldName = (controlName, count = 1) => `${controlName}[${count}]`
const getUploadControlName = (fileName = '') => fileName.replace(/\[\d+\]$/g, '')

module.exports = {
  getUploadFieldName,
  getUploadControlName
}
