const jsonPath = require('jsonpath')
const processControl = require('./process-control')

module.exports = function processInput (pageInstance, userData) {
  jsonPath
    .query(pageInstance, '$..[?(@.name)]')
    .forEach((instance) => {
      processControl(pageInstance, userData, instance)
    })

  return pageInstance
}
