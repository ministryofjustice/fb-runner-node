const {getServiceSchema} = require('../../service-data/service-data')
const {getInstanceController} = require('../../controller/controller')

const getComponentComposite = (componentInstance) => {
  const {_type} = componentInstance
  let composite
  const schema = getServiceSchema(_type)
  if (schema) {
    composite = schema.composite
    const componentController = getInstanceController(componentInstance)
    if (componentController.getComposite) {
      composite = componentController.getComposite(componentInstance)
    }
  }
  return composite
}

module.exports = getComponentComposite
