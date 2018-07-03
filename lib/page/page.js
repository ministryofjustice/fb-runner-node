
const skipPage = require('./skip-page/skip-page')
const processInput = require('./process-input/process-input')
const validateInput = require('./validate-input/validate-input')
const formatProperties = require('./format-properties/format-properties')
const updateControlNames = require('./update-control-names/update-control-names')
const skipComponents = require('./skip-components/skip-components')
const kludgeUpdates = require('./kludge-updates/kludge-updates')

module.exports = {
  skipPage,
  processInput,
  validateInput,
  formatProperties,
  updateControlNames,
  skipComponents,
  kludgeUpdates
}
