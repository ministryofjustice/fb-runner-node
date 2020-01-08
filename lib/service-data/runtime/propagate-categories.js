/**
 * @module propagateCategories
 **/

//  NB. this propagation method could be deprecated
// this info could arguably be better obtained by providing a helper method to query an instance’s schema

const jsonPath = require('jsonpath')
const cloneDeep = require('lodash.clonedeep')

/**
 * Propagate category information through nested instances
 *
 * @param {object} instances
 *  Object of service instances keyed by id
 *
 * @param {object} schemas
 *  Object of service schemas keyed by _name
 *
 * @return {object}
 *  Cloned object containing instances with propagated categories
 **/
const propagate = (instances, schemas) => {
  instances = cloneDeep(instances)

  Object.keys(schemas).forEach(type => {
    const categoryTypes = schemas[type].category
    if (categoryTypes) {
      const categoryInstances = jsonPath.query(instances, `$..[?(@._type === "${type}")]`)
      categoryInstances.forEach(categoryInstance => {
        categoryTypes.forEach(categoryType => {
          // TODO: Is ${categoryType} the best idea?
          categoryInstance[`$${categoryType}`] = true
        })
      })
    }
  })

  return instances
}
module.exports = {
  propagate
}
