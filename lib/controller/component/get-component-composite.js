require('@ministryofjustice/module-alias/register-module')(module)

const {
  getServiceSchema
} = require('~/fb-runner-node/service-data/service-data')

const getComponentController = require('./get-component-controller')

module.exports = function getComponentComposite (componentInstance) {
  if (componentInstance) {
    if (Reflect.has(componentInstance, '_type')) {
      const serviceSchema = getServiceSchema(Reflect.get(componentInstance, '_type'))
      if (serviceSchema) {
        if (Reflect.has(serviceSchema, 'composite')) {
          return getComponentController(componentInstance)
            .getComposite(componentInstance)
        }
      }
    }
  }
}
