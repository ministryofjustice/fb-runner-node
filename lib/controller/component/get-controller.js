require('@ministryofjustice/module-alias/register-module')(module)

/*
 *  Controllers are effectively singletons (instances are memoised
 *  to these scoped variables)
 */
let answersController
let autocompleteController
let checkboxesController
let dateController
let radiosController
let selectController
let uploadController
let commonController

/*
 *  There are circularities in the modules so the controllers are required
 *  at run-time (until I have addressed the circularities)
 */
function getAnswersController () {
  if (!answersController) {
    const AnswersController = require('./type/answers')

    answersController = new AnswersController()
  }

  return answersController
}

function getAutocompleteController () {
  if (!autocompleteController) {
    const AutocompleteController = require('./type/autocomplete')

    autocompleteController = new AutocompleteController()
  }

  return autocompleteController
}

function getCheckboxesController () {
  if (!checkboxesController) {
    const CheckboxesController = require('./type/checkboxes')

    checkboxesController = new CheckboxesController()
  }

  return checkboxesController
}

function getDateController () {
  if (!dateController) {
    const DateController = require('./type/date')

    dateController = new DateController()
  }

  return dateController
}

function getRadiosController () {
  if (!radiosController) {
    const RadiosController = require('./type/radios')

    radiosController = new RadiosController()
  }

  return radiosController
}

function getSelectController () {
  if (!selectController) {
    const SelectController = require('./type/select')

    selectController = new SelectController()
  }

  return selectController
}

function getUploadController () {
  if (!uploadController) {
    const UploadController = require('./type/upload')

    uploadController = new UploadController()
  }

  return uploadController
}

function getCommonController () {
  if (!commonController) {
    const CommonController = require('./common')

    commonController = new CommonController()
  }

  return commonController
}

function getComponentControllerByType (type) {
  switch (type) {
    case 'answers':
      return getAnswersController()

    case 'autocomplete':
      return getAutocompleteController()

    case 'checkboxes':
      return getCheckboxesController()

    case 'date':
      return getDateController()

    case 'radios':
      return getRadiosController()

    case 'select':
      return getSelectController()

    case 'upload':
      return getUploadController()

    default:
      return getCommonController()
  }
}

module.exports = ({ _type }) => getComponentControllerByType(_type)
