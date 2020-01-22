require('@ministryofjustice/module-alias/register-module')(module)

const {
  getComponentMaxFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const {
  getFieldName
} = require('~/fb-runner-node/page/utils/utils-controls')

module.exports = function getAllowedComponents (components) {
  return components.reduce((accumulator, control) => {
    const {
      name
    } = control

    const maxFiles = getComponentMaxFiles(control)
    let count = 1
    const limit = maxFiles + 1

    while (count < limit) {
      accumulator.push({
        name: getFieldName(name, count),
        maxCount: 1
      })

      count++
    }

    return accumulator
  }, [])
}
