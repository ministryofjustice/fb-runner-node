const {
  getInstanceProperty
} = require('../service-data/service-data')

let mappings

const init = () => {
  if (mappings) {
    return
  }
  mappings = {}

  const elements = [
    ['heading', 'any'],
    ['heading.page.start', 'any'],
    ['label', 'single', 'multiple'],
    ['legend', 'single', 'multiple']
  ]

  elements.forEach(elementBundle => {
    const element = elementBundle.shift()
    mappings[element] = {}
    const elementStub = `sizeClass.${element}`
    elementBundle.forEach(type => {
      const elementLookup = elementStub + (type === 'any' ? '' : `.${type}`)
      const value = getInstanceProperty(elementLookup, 'value')
      mappings[element][type] = value || ''
    })
  })
}

const getMappings = () => {
  init()
  return mappings
}

const getClass = (element, type = 'any') => {
  init()
  if (mappings[element]) {
    return mappings[element][type]
  }
  return ''
}

module.exports = {
  getMappings,
  getClass
}
