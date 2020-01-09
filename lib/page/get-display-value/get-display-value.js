require('@ministryofjustice/module-alias/register-module')(module)

const getComponentController = require('~/fb-runner-node/controller/component/get-controller')

function getDisplayValue (nameInstance, userData) {
  return getComponentController(nameInstance)
    .getDisplayValue(nameInstance, userData)
}

module.exports = getDisplayValue
