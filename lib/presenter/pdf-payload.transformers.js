const isObject = (value) => (value || false) instanceof Object

const hasGroup = (group) => ({groupBy}) => group === groupBy

const aggregateGroups = (accumulator = [], {groupBy, ...answer} = {}, i, answers) => accumulator.some(hasGroup(groupBy)) ? accumulator : accumulator.concat(transformGroup({...answer, groupBy}, answers.filter(hasGroup(groupBy))))

const aggregateGroup = (accumulator = {}, current = {}) => {
  const {
    value: {
      html: valueHtmlList = [],
      text: valueTextList = [],
      machine: machineList = []
    } = {}
  } = accumulator

  const {
    value: {
      html: valueHtml = '',
      text: valueText = '',
      machine = ''
    } = {}
  } = current

  return {
    value: {
      html: valueHtmlList.concat(valueHtml),
      text: valueTextList.concat(valueText),
      machine: machineList.concat(machine)
    }
  }
}

const transformGroup = (answer, group) => {
  const {
    component,
    groupBy,
    key
  } = answer

  const {
    value: {
      html: valueHtmlList = [],
      text: valueTextList = [],
      machine: machineList = []
    } = {}
  } = group.reduce(aggregateGroup, {})

  return {
    component: component !== groupBy ? groupBy : component,
    groupBy,
    key,
    value: {
      html: valueHtmlList.join('\n\n').trim(),
      text: valueTextList.join('\n\n').trim(),
      machine: machineList.some(isObject)
        ? machineList
        : machineList.join('\n\n').trim()
    }
  }
}

module.exports = {
  isObject,
  hasGroup,
  aggregateGroups,
  aggregateGroup,
  transformGroup
}
