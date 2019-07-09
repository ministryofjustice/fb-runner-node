const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const serviceData = require('../service-data/service-data')

const getInstancePropertyStub = stub(serviceData, 'getInstanceProperty')
getInstancePropertyStub.callsFake((prop, value) => {
  const excludes = [
    'sizeClass.heading.page.start',
    'sizeClass.legend.multiple'
  ]
  if (excludes.includes(prop)) {
    return
  }
  return prop
})

const {
  getMappings,
  getClass
} = proxyquire('./element-size-mappings', {
  '../service-data/service-data': serviceData
})

test('When requesting the size mappings', t => {
  const mappings = getMappings()

  t.deepEqual(mappings, {
    heading: {
      any: 'sizeClass.heading'
    },
    'heading.page.start': {
      any: ''
    },
    label: {
      single: 'sizeClass.label.single',
      multiple: 'sizeClass.label.multiple'
    },
    legend: {
      single: 'sizeClass.legend.single',
      multiple: ''
    }
  }, 'it should return the mappings')

  t.end()
})

test('When requesting a size mapping class that has been specified', t => {
  const headingClass = getClass('heading')
  t.deepEqual(headingClass, 'sizeClass.heading', 'it should return the value')
  t.end()
})

test('When requesting a size mapping class for a specific type', t => {
  const labelSingleClass = getClass('label', 'single')
  t.deepEqual(labelSingleClass, 'sizeClass.label.single', 'it should return the single value')
  const labelMultipleClass = getClass('label', 'multiple')
  t.deepEqual(labelMultipleClass, 'sizeClass.label.multiple', 'it should return the multiple value')
  t.end()
})

test('When requesting a size mapping class that has not been specified', t => {
  const headingPageStartClass = getClass('heading.page.start')
  t.deepEqual(headingPageStartClass, '', 'it should return an empty string')
  t.end()
})
