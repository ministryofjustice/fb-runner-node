
const skipPage = require('./skip-page/skip-page')
const setComposite = require('./set-composite/set-composite')
const setControlNames = require('./set-control-names/set-control-names')
const setRepeatable = require('./set-repeatable/set-repeatable')
const setMultipartForm = require('./set-multipart-form/set-multipart-form')
const processUploads = require('./process-uploads/process-uploads')
const setUploads = require('./set-uploads/set-uploads')
const removeItem = require('./remove-item/remove-item')
const addItem = require('./add-item/add-item')
const processInput = require('./process-input/process-input')
const validateInput = require('./validate-input/validate-input')
const redirectNextPage = require('./redirect-next-page/redirect-next-page')
const setFormContent = require('./set-form-content/set-form-content')
const setDefaultValues = require('./set-default-values/set-default-values')
const formatProperties = require('./format-properties/format-properties')
const getDisplayValue = require('./get-display-value/get-display-value')
const updateControlNames = require('./update-control-names/update-control-names')
const setService = require('./set-service/set-service')
const skipComponents = require('./skip-components/skip-components')
const kludgeUpdates = require('./kludge-updates/kludge-updates')

module.exports = {
  skipPage,
  setComposite,
  setControlNames,
  setRepeatable,
  setMultipartForm,
  processUploads,
  setUploads,
  removeItem,
  addItem,
  processInput,
  validateInput,
  redirectNextPage,
  setFormContent,
  setDefaultValues,
  formatProperties,
  getDisplayValue,
  updateControlNames,
  setService,
  skipComponents,
  kludgeUpdates
}
