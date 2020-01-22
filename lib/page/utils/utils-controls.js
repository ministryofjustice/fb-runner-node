const jsonPath = require('jsonpath')

const getFieldName = (componentName, count = 1) => `${componentName}[${count}]`
const getComponentName = (fieldName = '') => fieldName.replace(/\[\d+\]$/g, '')
const getComponentType = (pageInstance, fieldName = '') => {
  const componentName = getComponentName(fieldName)
  const components = jsonPath.query(pageInstance, '$..[?(@._type === "fileupload"||@._type === "upload")]')
  if (components.some(({name}) => name === componentName)) {
    const {_type} = components.find(({name}) => name === componentName)

    return _type
  }
}

module.exports = {
  getFieldName,
  getComponentName,
  getComponentType
}
