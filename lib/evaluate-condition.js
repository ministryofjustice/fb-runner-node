/**
 * @module evaluateCondition
 **/
const jp = require('jsonpath')

const {deepClone} = require('@ministryofjustice/fb-utils-node')

const evaluateConditions = (conditions, data = {}) => {
  return conditions.map(condition => evaluate(condition, data))
    .filter(result => result)
}

const checkCondition = (operator, variable, value) => {
  let result = false
  if (operator === 'defined') {
    result = variable !== undefined
  } else if (operator === 'is') {
    result = variable === value
  } else if (operator === 'startsWith') {
    result = variable.startsWith(value)
  } else if (operator === 'endsWith') {
    result = variable.endsWith(value)
  } else if (operator === 'includes') {
    result = variable.includes(value)
  } else if (operator === 'match') {
    // result = variable.match(new RegExp(value)) // slashes etc?
  } else if (operator === 'equals') {
    result = variable === value
  } else if (operator === 'greaterThan') {
    result = variable > value
  } else if (operator === 'greaterThanOrEqual') {
    result = variable >= value
  } else if (operator === 'lessThan') {
    result = variable < value
  } else if (operator === 'lessThanOrEqual') {
    result = variable <= value
  } else if (operator === 'multipleOf') {
    result = variable % value === 0
  } else if (operator === 'isTrue') {
    result = variable === true
  }
  return result
}

const getData = (dataIdentifier, data) => {
  if (!data) {
    return
  }
  if (dataIdentifier.indexOf('.') !== -1 || dataIdentifier.indexOf('[') !== -1) {
    const query = `${dataIdentifier.charAt(0) === '$' ? '' : '$.'}${dataIdentifier}`
    return jp.query(data, query)
  } else {
    return [data[dataIdentifier]]
  }
}

const negateResultIfNecessary = (result, negated) => {
  return negated ? !result : result
}

const evaluate = (condition, data) => {
  if (typeof condition === 'boolean') {
    return condition
  }
  const negated = condition.negated
  let result = false
  if (condition.operator) {
    const {operator} = condition
    const identifierType = condition.identifierType || 'input' // should be derived from schema?
    const sourceData = data[identifierType]
    if (condition.identifierMatchType && condition.identifierMatchType !== 'is') {
      const identifierMatchValue = condition.identifier
      // if (!identifierMatchValue) {
      //   return false // what about negation?
      // }
      // startsWith, endsWith, includes, match
      const identifierMethod = condition.identifierMatchType
      const identifiers = Object.keys(sourceData).filter(key => key[identifierMethod](identifierMatchValue))
      if (!identifiers.length) {
        return negateResultIfNecessary(false, negated)
      }
      // what about allowing allof, oneof matches for identifierMatchType?
      // identifierMatch = [one|any|all]
      const anyOfMatchedConditions = identifiers.map(identifier => {
        const matchedCondition = deepClone(condition)
        matchedCondition.identifier = identifier
        delete matchedCondition.identifierMatchType
        delete matchedCondition.negated
        return matchedCondition
      })
      return negateResultIfNecessary(evaluate({anyOfConditions: anyOfMatchedConditions}, data), negated)
    }
    let variable = getData(condition.identifier, sourceData)

    let value = [condition.value]
    if (condition.valueType) {
      const sourceValue = data[condition.valueType]
      value = getData(value[0], sourceValue)
    }
    if (condition.identifierMatchAll && value.length > 1) {
      throw new Error('Only one value can be matched against all identifiers')
    }

    let passed = 0
    variable.forEach(checkVar => {
      value.forEach(checkVal => {
        if (checkCondition(operator, checkVar, checkVal)) {
          passed++
        }
      })
    })
    if (passed) {
      if (condition.identifierMatchAll) {
        if (passed === variable.length) {
          result = true
        }
      } else {
        result = true
      }
    }
  } else {
    if (condition.oneOfConditions) {
      const conditionsMet = evaluateConditions(condition.oneOfConditions, data)
      result = conditionsMet.length === 1
    } else if (condition.anyOfConditions) {
      const conditionsMet = evaluateConditions(condition.anyOfConditions, data)
      result = conditionsMet.length >= 1
    } else if (condition.allOfConditions) {
      const conditionsMet = evaluateConditions(condition.allOfConditions, data)
      result = conditionsMet.length === condition.allOfConditions.length
    }
  }
  return negateResultIfNecessary(result, negated)
}

const evaluateInput = (condition, input) => {
  return evaluate(condition, {
    input
  })
}

module.exports = {
  evaluate,
  evaluateInput
}
