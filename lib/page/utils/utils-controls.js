const getUploadFieldName = (controlName, count = 1) => `${controlName}[${count}]`
const getUploadControlName = (fieldName = '') => fieldName.replace(/\[\d+\]$/g, '')

module.exports = {
  getUploadFieldName,
  getUploadControlName
}
