const jp = require('jsonpath')
const {default: produce} = require('immer')
const {evaluateInput} = require('../../evaluate-condition/evaluate-condition')

const skipComponents = (pageInstance, userData) => {
  let skippedComponentsPageInstance = produce(pageInstance, draft => {
    const {getUserData} = userData
    const input = getUserData()
    const showNodes = jp.nodes(draft, '$..[?(@.show || @.show === false)]').reverse()
    showNodes.forEach(showNode => {
      const show = evaluateInput(showNode.value.show, input)
      if (show === false) {
        const showPath = showNode.path
        const prop = showPath.pop()
        const parent = jp.query(draft, jp.stringify(showPath))[0]
        if (Array.isArray(parent)) {
          parent.splice(prop, 1)
        } else {
          delete parent[prop]
        }
      // FBLogger(`Removed ${showNode.value._id} instance since it should not be shown`)
      }
    })
  })
  // Handle conditional components
  skippedComponentsPageInstance = produce(skippedComponentsPageInstance, draft => {
    const conditionalNodes = jp.nodes(draft, '$..[?(@.conditionalComponent)]')
    conditionalNodes.forEach(node => {
      let {path, value} = node
      let identifier
      if (value.name) {
        identifier = value.name
      } else {
        while (!identifier && path.length) {
          path.pop()
          const ancestorValue = jp.query(draft, jp.stringify(path))[0]
          if (ancestorValue && ancestorValue.name) {
            identifier = ancestorValue.name
          }
        }
      }
      if (identifier) {
        let $conditionalShow = {
          identifier,
          operator: 'is',
          value: value.value
        }
        if (!$conditionalShow.value && value._type === 'checkbox') {
          $conditionalShow.value = 'yes'
          // TODO: use schema's defaultValue
        }
        value.conditionalComponent.$conditionalShow = $conditionalShow
      }
    })
  })
  return skippedComponentsPageInstance
}

module.exports = skipComponents
