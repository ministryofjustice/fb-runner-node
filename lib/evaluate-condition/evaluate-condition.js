/**
 * @module evaluateCondition
 **/
const jp = require('jsonpath')
const set = require('lodash.set')

const {deepClone} = require('@ministryofjustice/fb-utils-node')

const evaluateConditions = (conditions, data = {}, scope) => {
  return conditions.map(condition => evaluate(condition, data, scope))
    .filter(result => result)
}

const checkCondition = (operator, variable, value) => {
  let result = false
  if (operator === 'defined') {
    result = variable !== undefined
  } else {
    if (variable === undefined) {
      result = false
    } else if (operator === 'same') {
      result = variable === value
    } else if (operator === 'is') {
      result = variable === value
    } else if (operator === 'startsWith') {
      result = variable.startsWith(value)
    } else if (operator === 'endsWith') {
      result = variable.endsWith(value)
    } else if (operator === 'includes') {
      result = variable.includes(value)
    } else if (operator === 'match') {
      if (typeof variable === 'number') {
        variable += ''
      }
      result = variable.match(new RegExp(value)) // slashes etc?
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
  }
  return result
}

const getData = (dataIdentifier, data) => {
  if (!data) {
    return
  }
  if (Object.keys(data).filter(key => key.includes('.')).length) {
    const mungedData = {}
    Object.keys(data).forEach(key => {
      set(mungedData, key, data[key])
    })
    data = mungedData
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

const evaluate = (condition, data = {}, scope = 'input') => {
  if (typeof condition === 'boolean') {
    return condition
  }
  condition = deepClone(condition)
  // if (condition.identifier && condition.identifier.includes('[*]')) {
  //   if (!condition.identifier.startsWith('$.')) {
  //     condition.identifier = `$.${condition.identifier}`
  //   }
  // }
  const negated = condition.negated
  let result = false
  if (condition.operator) {
    const {operator} = condition
    const identifierType = condition.identifierType || scope // TODO: should be derived from schema?

    if (condition.operator === 'same') {
      if (!condition.identifier.endsWith(']')) {
        condition.identifier += '[*]'
      }
      condition.value = condition.identifier.replace(/\[\*\]$/, '[0]')
      condition.valueType = identifierType
      condition.identifierMatchAll = true
    }

    const sourceData = data[identifierType] || {}
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
      return negateResultIfNecessary(evaluate({any: anyOfMatchedConditions}, data), negated)
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
    if (condition.exactly) {
      const conditionsMet = evaluateConditions(condition.exactly, data, scope)
      result = conditionsMet.length === (condition.conditionsMet || 1)
    } else if (condition.any) {
      const conditionsMet = evaluateConditions(condition.any, data, scope)
      result = conditionsMet.length >= (condition.conditionsMet || 1)
    } else if (condition.all) {
      const conditionsMet = evaluateConditions(condition.all, data, scope)
      result = conditionsMet.length === condition.all.length
    }
  }
  return negateResultIfNecessary(result, negated)
}

const evaluateInput = (condition, input) => {
  return evaluate(condition, {
    input
  })
}

const evaluationOperators = {
  defined: {
    type: 'any',
    yes: 'exists',
    no: 'does not exist'
  },
  is: {
    type: 'string',
    yes: 'is',
    no: 'is not'
  },
  startsWith: {
    type: 'string',
    yes: 'starts with',
    no: 'does not start with'
  },
  endsWith: {
    type: 'string',
    yes: 'ends with',
    no: 'does not end with'
  },
  includes: {
    type: 'string',
    yes: 'includes',
    no: 'does not include'
  },
  match: {
    type: 'string',
    yes: 'matches',
    no: 'does not match'
  },
  equals: {
    type: 'number',
    yes: 'equals',
    no: 'does not equal'
  },
  greaterThan: {
    type: 'number',
    yes: 'is greater than',
    no: 'is not greater than'
  },
  greaterThanOrEqual: {
    type: 'number',
    yes: 'is greater than or equal to',
    no: 'is not greater than or equal to'
  },
  lessThan: {
    type: 'number',
    yes: 'is less than',
    no: 'is not less than'
  },
  lessThanOrEqual: {
    type: 'number',
    yes: 'is less than or equal to',
    no: 'is not less than or equal to'
  },
  multipleOf: {
    type: 'number',
    yes: 'is a multiple of',
    no: 'is not a multiple of'
  },
  isTrue: {
    type: 'boolean',
    yes: 'is true',
    no: 'is not true'
  }
}
const getEvaluationOperators = () => evaluationOperators

module.exports = {
  evaluate,
  evaluateInput,
  getEvaluationOperators
}
