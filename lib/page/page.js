
const skipPage = require('./skip-page/skip-page')
const setComposite = require('./set-composite/set-composite')
const setRepeatable = require('./set-repeatable/set-repeatable')
const processInput = require('./process-input/process-input')
const validateInput = require('./validate-input/validate-input')
const formatProperties = require('./format-properties/format-properties')
const updateControlNames = require('./update-control-names/update-control-names')
const skipComponents = require('./skip-components/skip-components')
const kludgeUpdates = require('./kludge-updates/kludge-updates')
const components = require('./component/component')

module.exports = {
  skipPage,
  setComposite,
  setRepeatable,
  processInput,
  validateInput,
  formatProperties,
  updateControlNames,
  skipComponents,
  kludgeUpdates,
  components
}
