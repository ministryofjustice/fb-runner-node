const test = require('tape')

const {deepClone} = require('@ministryofjustice/fb-utils-node')

const {evaluate} = require('./evaluate-condition')

// DATA

const input = {
  notDefined: undefined,
  text: 'text value',
  texas: 'texas value',
  emptyText: '',
  number: 10,
  zero: 0,
  trueBoolean: true,
  falseBoolean: false,
  array: ['array item value', 2, true, false],
  object: {
    textProp: 'property value',
    numberProp: 50,
    booleanProp: true,
    falseProp: false
  },
  arrayB: ['yes', 'yes', 'yes'],
  arrayC: ['yes', 'no', 'yes']
}
const feature = {
  text: 'feature text value',
  texas: 'texas value',
  numberA: 10,
  numberB: 11,
  numberC: 10
}
const data = {
  input,
  feature
}

// TESTS
/*
 * name: {
 *  description: '', // required if name is not a property or operator value
 *  passing: {},
 *  failing: {},
 *  additional: {}
 *  additionalFailing: {}
 * }
 */
const operatorTests = {
  boolean: {
    description: 'When a boolean value is evaluated',
    additional: {
      'it should return true when the value is true': true
    },
    additionalFailing: {
      'it should return false when the value is false': false
    }
  },
  identifierType: {
    passing: {
      identifierType: 'feature',
      identifier: 'text',
      operator: 'is',
      value: 'feature text value'
    },
    failing: {
      identifierType: 'feature',
      identifier: 'text',
      operator: 'is',
      value: 'text value'
    }
  },
  defined: {
    passing: {
      identifier: 'text',
      operator: 'defined'
    },
    failing: {
      identifier: 'doesNotExist',
      operator: 'defined'
    },
    additional: {
      'it should return true for an empty string': {
        identifier: 'emptyText',
        operator: 'defined'
      },
      'it should return true for zero': {
        identifier: 'zero',
        operator: 'defined'
      },
      'it should return true for a false boolean': {
        identifier: 'falseBoolean',
        operator: 'defined'
      }
    }
  },
  is: {
    passing: {
      identifier: 'text',
      operator: 'is',
      value: 'text value'
    },
    failing: {
      identifier: 'text',
      operator: 'is',
      value: 'wrong value'
    }
  },
  startsWith: {
    passing: {
      identifier: 'text',
      operator: 'startsWith',
      value: 'text v'
    },
    failing: {
      identifier: 'text',
      operator: 'startsWith',
      value: 'text b'
    }
  },
  endsWith: {
    passing: {
      identifier: 'text',
      operator: 'endsWith',
      value: 't value'
    },
    failing: {
      identifier: 'text',
      operator: 'endsWith',
      value: 'z value'
    }
  },
  includes: {
    passing: {
      identifier: 'text',
      operator: 'includes',
      value: 'ext'
    },
    failing: {
      identifier: 'text',
      operator: 'includes',
      value: 'next'
    }
  },
  equals: {
    passing: {
      identifier: 'number',
      operator: 'equals',
      value: 10
    },
    failing: {
      identifier: 'number',
      operator: 'equals',
      value: 11
    }
  },
  greaterThan: {
    passing: {
      identifier: 'number',
      operator: 'greaterThan',
      value: 9
    },
    failing: {
      identifier: 'number',
      operator: 'greaterThan',
      value: 10
    }
  },
  greaterThanOrEqual: {
    passing: {
      identifier: 'number',
      operator: 'greaterThanOrEqual',
      value: 10
    },
    failing: {
      identifier: 'number',
      operator: 'greaterThanOrEqual',
      value: 11
    }
  },
  lessThan: {
    passing: {
      identifier: 'number',
      operator: 'lessThan',
      value: 11
    },
    failing: {
      identifier: 'number',
      operator: 'lessThan',
      value: 10
    }
  },
  lessThanOrEqual: {
    passing: {
      identifier: 'number',
      operator: 'lessThanOrEqual',
      value: 10
    },
    failing: {
      identifier: 'number',
      operator: 'lessThanOrEqual',
      value: 9
    }
  },
  multipleOf: {
    passing: {
      identifier: 'number',
      operator: 'multipleOf',
      value: 5
    },
    failing: {
      identifier: 'number',
      operator: 'multipleOf',
      value: 3
    }
  },
  isTrue: {
    passing: {
      identifier: 'trueBoolean',
      operator: 'isTrue'
    },
    failing: {
      identifier: 'falseBoolean',
      operator: 'isTrue'
    }
  },
  valueType: {
    passing: {
      identifier: 'number',
      operator: 'equals',
      valueType: 'feature',
      value: 'numberA'
    },
    failing: {
      identifier: 'number',
      operator: 'equals',
      valueType: 'feature',
      value: 'numberB'
    },
    additional: {
      'it should return true when identifier type and value type are both set and the condition is met': {
        identifierType: 'feature',
        identifier: 'numberC',
        operator: 'equals',
        valueType: 'feature',
        value: 'numberA'
      },
      'it should return true when identifier type is another jsonpath query and the condition is met': {
        identifier: 'number',
        operator: 'lessThan',
        valueType: 'feature',
        value: 'numberB'
      },
      'it should return true when identifier type is a jsonpath query and the condition is met': {
        identifier: 'texas',
        operator: 'is',
        valueType: 'feature',
        value: '$.texas'
      }
    },
    additionalFailing: {
      'it should return false when identifier type and value type are both set and the condition is not met': {
        identifierType: 'feature',
        identifier: 'numberB',
        operator: 'equals',
        valueType: 'feature',
        value: 'numberA'
      }
    }
  },
  nestedVariables: {
    description: 'When a condition with an identifier that is not a simple key is evaluated',
    additional: {
      'it should return true for a defined value in an array that meets the condition': {
        identifier: 'array[0]',
        operator: 'defined'
      },
      'it should return true for a text value in an array that meets the condition': {
        identifier: 'array[0]',
        operator: 'is',
        value: 'array item value'
      },
      'it should return true for a text value in an object that meets the condition': {
        identifier: 'object.textProp',
        operator: 'is',
        value: 'property value'
      },
      'it should return true for a number value in an array that meets the condition': {
        identifier: 'array[1]',
        operator: 'equals',
        value: 2
      },
      'it should return true for a number value in an object that meets the condition': {
        identifier: 'object.numberProp',
        operator: 'equals',
        value: 50
      },
      'it should return true for a boolean value in an array that meets the condition': {
        identifier: 'array[2]',
        operator: 'isTrue'
      },
      'it should return true for a boolean value in an object that meets the condition': {
        identifier: 'object.booleanProp',
        operator: 'isTrue'
      },
      'it should return true for a jsonpath query matching object properties that meets the condition': {
        identifier: '$..textProp',
        operator: 'is',
        value: 'property value'
      },
      'it should return true for a jsonpath query matching array items that meets the condition': {
        identifier: '$.array[*]',
        operator: 'is',
        value: 'array item value'
      }
    },
    additionalFailing: {
      'it should return false for a defined value in an array that does not meet the condition': {
        identifier: 'array[10]',
        operator: 'defined'
      },
      'it should return false for a text value in an array that does not meet the condition': {
        identifier: 'array[0]',
        operator: 'is',
        value: 'array item valuex'
      },
      'it should return false for a text value in an object that does not meet the condition': {
        identifier: 'object.textProp',
        operator: 'is',
        value: 'property valuex'
      },
      'it should return false for a number value in an array that does not meet the condition': {
        identifier: 'array[1]',
        operator: 'equals',
        value: 1
      },
      'it should return false for a number value in an object that does not meet the condition': {
        identifier: 'object.numberProp',
        operator: 'equals',
        value: 51
      },
      'it should return false for a boolean value in an array that does not meet the condition': {
        identifier: 'array[3]',
        operator: 'isTrue'
      },
      'it should return false for a boolean value in an object that does not meet the condition': {
        identifier: 'object.falseProp',
        operator: 'isTrue'
      },
      'it should return false for a jsonpath query matching object properties that does not meet the condition': {
        identifier: '$..textProp',
        operator: 'is',
        value: 'not property value'
      },
      'it should return false for a jsonpath query matching array items that does not meet the condition': {
        identifier: '$.array[*]',
        operator: 'is',
        value: 'not array item value'
      }
    }
  },
  identifierMatchType: {
    passing: {
      identifierMatchType: 'startsWith',
      identifier: 'tex',
      operator: 'is',
      value: 'text value'
    },
    failing: {
      identifierMatchType: 'startsWith',
      identifier: 'teb',
      operator: 'is',
      value: 'text value'
    },
    additional: {
      'it should return true when the identifierMatchType is "startsWith" and the condition is met': {
        identifierMatchType: 'startsWith',
        identifier: 'tex',
        operator: 'is',
        value: 'text value'
      },
      'it should return true when the identifierMatchType is "endsWith" and the condition is met': {
        identifierMatchType: 'endsWith',
        identifier: 'ext',
        operator: 'is',
        value: 'text value'
      },
      'it should return true when the identifierMatchType is "includes" and the condition is met': {
        identifierMatchType: 'includes',
        identifier: 'ex',
        operator: 'is',
        value: 'text value'
      },
      'it should return true when the identifierMatchType is "match" and the condition is met': {
        identifierMatchType: 'match',
        identifier: '^.e.*$',
        operator: 'is',
        value: 'text value'
      }
    },
    additionalFailing: {
      'it should return false when the identifierMatchType is "startsWith" and there are no matching keys in the data': {
        identifierMatchType: 'startsWith',
        identifier: 'teb',
        operator: 'is',
        value: 'text value'
      },
      'it should return false when the identifierMatchType is "endsWith" and there are no matching keys in the data': {
        identifierMatchType: 'endsWith',
        identifier: 'exb',
        operator: 'is',
        value: 'text value'
      },
      'it should return false when the identifierMatchType is "includes" and there are no matching keys in the data': {
        identifierMatchType: 'includes',
        identifier: 'eb',
        operator: 'is',
        value: 'text value'
      },
      'it should return false when the identifierMatchType is "match" and there are no matching keys in the data': {
        identifierMatchType: 'match',
        identifier: '^.z.*$',
        operator: 'is',
        value: 'text value'
      },
      'it should return false when the identifierMatchType is "startsWith" and there are matching keys in the data but the condition is not met': {
        identifierMatchType: 'startsWith',
        identifier: 'tex',
        operator: 'is',
        value: 'wrong value'
      },
      'it should return false when the identifierMatchType is "endsWith" and there are matching keys in the data but the condition is not met': {
        identifierMatchType: 'endsWith',
        identifier: 'ext',
        operator: 'is',
        value: 'wrong value'
      },
      'it should return false when the identifierMatchType is "includes" and there are matching keys in the data but the condition is not met': {
        identifierMatchType: 'includes',
        identifier: 'ex',
        operator: 'is',
        value: 'wrong value'
      },
      'it should return false when the identifierMatchType is "match" and there are matching keys in the data but the condition is not met': {
        identifierMatchType: 'match',
        identifier: '^.e.*$',
        operator: 'is',
        value: 'wrong value'
      }
    }
  },
  identifierMatchAll: {
    passing: {
      identifier: '$.arrayB[*]',
      identifierMatchAll: true,
      operator: 'is',
      value: 'yes'
    },
    failing: {
      identifier: '$.arrayC[*]',
      identifierMatchAll: true,
      operator: 'is',
      value: 'yes'
    },
    additional: {
      'it should return true for a condition asking if all the items in an array are equal': {
        identifier: '$.arrayB[*]',
        identifierMatchAll: true,
        operator: 'is',
        value: '$.arrayB[0]',
        valueType: 'input'
      }
    }
  }
}

// Construct the all/any/one tests from the previous tests

const nonePassing = [
  operatorTests.is.failing,
  operatorTests.equals.failing
]

const onePassing = [
  operatorTests.is.passing,
  operatorTests.is.failing,
  operatorTests.equals.failing
]

const twoPassing = [
  operatorTests.is.passing,
  operatorTests.equals.passing,
  operatorTests.equals.failing
]

const allPassing = [
  operatorTests.is.passing,
  operatorTests.equals.passing,
  operatorTests.isTrue.passing
]

const allOfConditions = {
  passing: {
    allOfConditions: deepClone(allPassing)
  },
  failing: {
    allOfConditions: deepClone(twoPassing)
  }
}

const anyOfConditions = {
  passing: {
    anyOfConditions: deepClone(onePassing)
  },
  failing: {
    anyOfConditions: deepClone(nonePassing)
  },
  additional: {
    'it should return true when more than one condition is met': {
      anyOfConditions: deepClone(twoPassing)
    },
    'it should return true when all conditions are met': {
      anyOfConditions: deepClone(allPassing)
    }
  }
}

const oneOfConditions = {
  passing: {
    oneOfConditions: deepClone(onePassing)
  },
  failing: {
    oneOfConditions: deepClone(nonePassing)
  },
  additionalFailing: {
    'it should return false when more than one condition is met': {
      oneOfConditions: deepClone(twoPassing)
    },
    'it should return false when all conditions are met': {
      oneOfConditions: deepClone(allPassing)
    }
  }
}

operatorTests.allOfConditions = allOfConditions
operatorTests.anyOfConditions = anyOfConditions
operatorTests.oneOfConditions = oneOfConditions

/*
 * Run the tests
 */

const runTests = (operator, tests) => {
  const sanityCheckTest = (test) => {
    if (!test) {
      return ''
    }
    if (!tests.description && test.operator !== operator && !test[operator]) {
      // No coverage of this line - just a sanity check to ensure the tests aren't obviously bogus
      throw new Error(`${operator} was not found as either a property or the operator in\n\n${JSON.stringify(test, null, 2)}`)
    }
    return test[operator] ? 'property' : 'operator'
  }

  const operatorType = sanityCheckTest(tests.passing)

  const testDescription = tests.description || `When a condition with the "${operator}" ${operatorType} is evaluated`

  test(testDescription, t => {
    if (tests.passing) {
      t.equal(evaluate(tests.passing, data), true, 'it should return true when the condition is met')
      const negatedPassing = deepClone(tests.passing)

      negatedPassing.negated = true
      t.equal(evaluate(negatedPassing, data), false, 'it should return false when the condition is met but the negated property is set to true')
    }

    if (tests.failing) {
      sanityCheckTest(tests.failing)

      t.equal(evaluate(tests.failing, data), false, 'it should return false when the condition is not met')

      const negatedFailing = deepClone(tests.failing)
      negatedFailing.negated = true
      t.equal(evaluate(negatedFailing, data), true, 'it should return true when the condition is not met but the negated property is set to true')
    }

    if (tests.additional) {
      Object.keys(tests.additional).forEach(extraTest => {
        sanityCheckTest(tests.additional[extraTest])

        t.equal(evaluate(tests.additional[extraTest], data), true, extraTest)
      })
    }

    if (tests.additionalFailing) {
      Object.keys(tests.additionalFailing).forEach(extraTest => {
        sanityCheckTest(tests.additionalFailing[extraTest])

        t.equal(evaluate(tests.additionalFailing[extraTest], data), false, extraTest)
      })
    }

    t.end()
  })
}

Object.keys(operatorTests).forEach(operator => {
  runTests(operator, operatorTests[operator])
})
