const jp = require('jsonpath')
const processControl = require('./process-control')

const processInput = (pageInstance, userData) => {
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  nameInstances.forEach(nameInstance => {
    processControl(pageInstance, userData, nameInstance)
  })

  return pageInstance
}

module.exports = processInput
