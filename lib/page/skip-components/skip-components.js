const jp = require('jsonpath')
const cloneDeep = require('lodash.clonedeep')

const skipComponents = (pageInstance, userData) => {
  pageInstance = cloneDeep(pageInstance)

  const showNodes = jp.nodes(pageInstance, '$..[?(@.show || @.show === false)]').reverse()
  showNodes.forEach(showNode => {
    const show = userData.evaluate(showNode.value.show, {
      page: pageInstance
    })
    if (show === false) {
      const showPath = showNode.path
      const prop = showPath.pop()
      const parent = jp.query(pageInstance, jp.stringify(showPath))[0]
      if (Array.isArray(parent)) {
        parent.splice(prop, 1)
      } else {
        delete parent[prop]
      }
      // FBLogger(`Removed ${showNode.value._id} instance since it should not be shown`)
    }
  })
  // Handle conditional components
  const conditionalNodes = jp.nodes(pageInstance, '$..[?(@.conditionalComponent)]')
  conditionalNodes.forEach(node => {
    const {path, value} = node
    let identifier
    if (value.name) {
      identifier = value.name
    } else {
      while (!identifier && path.length) {
        path.pop()
        const ancestorValue = jp.query(pageInstance, jp.stringify(path))[0]
        if (ancestorValue && ancestorValue.name) {
          identifier = ancestorValue.name
        }
      }
    }
    if (identifier) {
      const $conditionalShow = {
        identifier,
        operator: 'is',
        value: value.value
      }
      if (!$conditionalShow.value && value._type === 'checkbox') {
        $conditionalShow.value = 'yes'
        // TODO: use schema's defaultValue
      }
      value.conditionalComponent.$conditionalShow = $conditionalShow
      if (value.conditionalComponent._type === 'checkboxes') {
        value.conditionalComponent.items.forEach(item => {
          item.$conditionalShow = $conditionalShow
        })
      }
    }
  })
  return pageInstance
}

module.exports = skipComponents
