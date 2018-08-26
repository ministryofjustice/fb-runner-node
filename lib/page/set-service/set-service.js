const {default: produce} = require('immer')

const {
  getInstance
} = require('../../service-data/service-data')

const setService = (pageInstance, userData) => {
  pageInstance = produce(pageInstance, draft => {
    const service = getInstance('service')
    draft.service = service
  })

  return pageInstance
}

module.exports = setService
