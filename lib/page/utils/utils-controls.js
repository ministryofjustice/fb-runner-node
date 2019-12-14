const jsonPath = require('jsonpath')

const getUploadFieldName = (controlName, count = 1) => `${controlName}[${count}]`
const getUploadControlName = (fieldName = '') => fieldName.replace(/\[\d+\]$/g, '')
const getUploadControlType = (pageInstance, fieldName = '') => {
  const uploadControls = jsonPath.query(pageInstance, '$..[?(@._type === "fileupload"||@._type === "upload")]')
  if (uploadControls.some(({name}) => getUploadControlName(fieldName))) {
    const {_type} = uploadControls.find(({name}) => getUploadControlName(fieldName))

    return _type
  }
}

module.exports = {
  getUploadFieldName,
  getUploadControlName,
  getUploadControlType
}
