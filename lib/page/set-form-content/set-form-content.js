const {
  getInstance
} = require('../../service-data/service-data')

const setFormContent = (pageInstance, userData) => {
  pageInstance.actions = getInstance('actions')
  return pageInstance
}

module.exports = setFormContent
