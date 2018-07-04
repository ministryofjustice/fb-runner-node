const test = require('tape')

const {
  setServiceInstances,
  getServiceInstances,
  getInstance,
  setInstance,
  getSourceInstance
} = require('./service-data')

test('When userData is required ', t => {
  t.equal(typeof setServiceInstances, 'function', 'it should export the setServiceInstances method')
  t.equal(typeof getServiceInstances, 'function', 'it should export the getServiceInstances method')
  t.equal(typeof getInstance, 'function', 'it should export the getInstance method')
  t.equal(typeof setInstance, 'function', 'it should export the setInstance method')
  t.equal(typeof getSourceInstance, 'function', 'it should export the getSourceInstance method')
  t.end()
})
