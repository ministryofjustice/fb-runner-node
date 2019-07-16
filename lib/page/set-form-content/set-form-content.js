const {default: produce} = require('immer')

const {
  getInstance
} = require('../../service-data/service-data')

const setFormContent = (pageInstance, userData) => {
  pageInstance = produce(pageInstance, draft => {
    draft.actions = getInstance('actions')
    return draft
  })
  return pageInstance
}

module.exports = setFormContent
