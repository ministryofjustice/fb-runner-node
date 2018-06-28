const test = require('tape')

const formatProperties = require('./format-properties')

test('When given no properties to update', t => {
  const emptyPageInstance = {}
  t.deepEqual(formatProperties(emptyPageInstance, {}), {}, 'it should do nothing')
  t.end()
})

test('When updating a page', t => {
  const emptyPageInstance = {}
  t.deepEqual(formatProperties(emptyPageInstance, {}), {}, 'it should do nothing')

  const contentProps = [
    'title',
    'heading',
    'lede',
    'legend',
    'label',
    'hint'
  ]
  contentProps.forEach(prop => {
    const pageInstance = {[prop]: '{x}'}
    t.deepEqual(formatProperties(pageInstance, {x: 'value'}), {[prop]: 'value'}, `it should update ${prop} properties`)
  })

  const pageInstance = {body: '{x}'}
  t.deepEqual(formatProperties(pageInstance, {x: 'value'}), {body: '<p>value</p>'}, 'it should update body properties')

  const pageInstanceWithHtml = {label: {html: '{x}'}}
  t.deepEqual(formatProperties(pageInstanceWithHtml, {x: 'value'}), {label: {html: 'value'}}, 'it should update nested html properties')

  t.end()
})
