const test = require('tape')

const setErrors = require('./set-errors')

const {
  setControlError,
  setSummaryErrors
} = setErrors

test('When setErrors is required ', t => {
  t.equal(typeof setControlError, 'function', 'it should export setControlError method')
  t.equal(typeof setSummaryErrors, 'function', 'it should export setSummaryErrors method')
  t.end()
})
