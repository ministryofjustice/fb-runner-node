const test = require('tape')

const kludgeUpdates = require('./kludge-updates')

const userData = {
  getUserData: () => ({})
}

test('When checking whether a page is a form type', t => {
  const formInstance = kludgeUpdates({
    _type: 'page.form'
  }, userData)
  t.equal(formInstance._form, true, 'it should mark pages of _type page.form as a form')

  const singlequestionInstance = kludgeUpdates({
    _type: 'page.singlequestion'
  }, userData)
  t.equal(singlequestionInstance._form, true, 'it should mark pages of _type page.singlequestion as a form')

  const contentInstance = kludgeUpdates({
    _type: 'page.content'
  }, userData)
  t.equal(contentInstance._form, undefined, 'it should not mark pages of other _types as a form')

  t.end()
})

test('When updating a page instance containing autocomplete components', t => {
  const autocompleteInstance = kludgeUpdates({
    _type: 'page.type',
    components: [{
      _type: 'autocomplete'
    }]
  }, userData)
  t.equal(autocompleteInstance.$useAutocomplete, true, 'it should add the $useAutocomplete property')

  t.end()
})

test('When updating a page instance actions', t => {
  const startInstance = kludgeUpdates({
    _type: 'page.start',
    actions: {
      primary: {}
    }
  }, userData)
  t.equal(startInstance.actions.primary.isStartButton, true, 'it should add the set the primary action’s isStartButton property if the page _type is page.start')

  const otherInstance = kludgeUpdates({
    _type: 'page.form',
    actions: {
      primary: {}
    }
  }, userData)
  t.equal(otherInstance.actions.primary.isStartButton, undefined, 'it should not add the set the primary action’s isStartButton property if the page _type is not page.start')

  t.end()
})

test('When updating a page instance that contains no autocomplete components', t => {
  const autocompleteInstance = kludgeUpdates({
    _type: 'page.type',
    components: [{
      _type: 'text'
    }]
  }, userData)
  t.equal(autocompleteInstance.$useAutocomplete, undefined, 'it should not add the $useAutocomplete property')

  t.end()
})
