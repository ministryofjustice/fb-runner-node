require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

class MockAnswersController {}
class MockAutocompleteController {}
class MockCheckboxesController {}
class MockDateController {}
class MockFileUploadController {}
class MockRadiosController {}
class MockSelectController {}
class MockUploadController {}

const getController = proxyquire('./get-controller', {
  './type/answers': MockAnswersController,
  './type/autocomplete': MockAutocompleteController,
  './type/checkboxes': MockCheckboxesController,
  './type/date': MockDateController,
  './type/fileupload': MockFileUploadController,
  './type/radios': MockRadiosController,
  './type/select': MockSelectController,
  './type/upload': MockUploadController
})

test('getting the answers controller', (t) => {
  t.ok(getController({ _type: 'answers' }) instanceof MockAnswersController, 'is an instanceof `AnswersController`')

  t.end()
})

test('getting the autocomplete controller', (t) => {
  t.ok(getController({ _type: 'autocomplete' }) instanceof MockAutocompleteController, 'is an instanceof `AutocompleteController`')

  t.end()
})

test('getting the checkboxes controller', (t) => {
  t.ok(getController({ _type: 'checkboxes' }) instanceof MockCheckboxesController, 'is an instanceof `CheckboxesController`')

  t.end()
})

test('getting the date controller', (t) => {
  t.ok(getController({ _type: 'date' }) instanceof MockDateController, 'is an instanceof `DateController`')

  t.end()
})

test('getting the fileupload controller', (t) => {
  t.ok(getController({ _type: 'fileupload' }) instanceof MockFileUploadController, 'is an instanceof `FileUploadController`')

  t.end()
})

test('getting the radios controller', (t) => {
  t.ok(getController({ _type: 'radios' }) instanceof MockRadiosController, 'is an instanceof `RadiosController`')

  t.end()
})

test('getting the select controller', (t) => {
  t.ok(getController({ _type: 'select' }) instanceof MockSelectController, 'is an instanceof `SelectController`')

  t.end()
})

test('getting the upload controller', (t) => {
  t.ok(getController({ _type: 'upload' }) instanceof MockUploadController, 'is an instanceof `UploadController`')

  t.end()
})
