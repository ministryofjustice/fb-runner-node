const jsonPath = require('jsonpath')

const getUploadFieldName = (controlName, count = 1) => `${controlName}[${count}]`
const getUploadControlName = (fieldName = '') => fieldName.replace(/\[\d+\]$/g, '')
const getUploadControlType = (pageInstance, fieldName = '') => {
  const controlName = getUploadControlName(fieldName)
  const uploadControls = jsonPath.query(pageInstance, '$..[?(@._type === "fileupload"||@._type === "upload")]')
  if (uploadControls.some(({name}) => name === controlName)) {
    const {_type} = uploadControls.find(({name}) => name === controlName)

    return _type
  }
}

module.exports = {
  getUploadFieldName,
  getUploadControlName,
  getUploadControlType
}
