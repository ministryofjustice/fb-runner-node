const {default: produce} = require('immer')
const formatProperties = require('../format-properties/format-properties')
const {
  getInstance
} = require('../../service-data/service-data')

const setService = (pageInstance, userData) => {
  pageInstance = produce(pageInstance, draft => {
    let service = getInstance('service')
    service = formatProperties(service, userData)
    draft.service = service
  })

  return pageInstance
}

module.exports = setService
