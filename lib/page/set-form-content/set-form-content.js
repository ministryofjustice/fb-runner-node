const {default: produce} = require('immer')

const {
  getInstance
} = require('../../service-data/service-data')

const setFormContent = async (pageInstance, userData) => {
  pageInstance = produce(pageInstance, draft => {
    draft.actions = getInstance('actions')
    return draft
  })
  return pageInstance
}

module.exports = setFormContent
