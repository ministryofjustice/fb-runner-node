require('@ministryofjustice/module-alias/register-module')(module)

const {
  getInstance
} = require('~/fb-runner-node/service-data/service-data')
const cloneDeep = require('lodash.clonedeep')

const setFormContent = (pageInstance, userData) => {
  pageInstance.actions = cloneDeep(getInstance('actions'))
  return pageInstance
}

module.exports = setFormContent
