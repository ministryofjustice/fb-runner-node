const jp = require('jsonpath')
const {default: produce} = require('immer')
const {evaluateInput} = require('../../evaluate-condition/evaluate-condition')

const skipComponents = (pageInstance, userData) => {
  let skippedComponentsPageInstance = produce(pageInstance, draft => {
    const {getUserData} = userData
    const input = getUserData()
    // TODO: handle cases where conditional reveal is in effect
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
  return skippedComponentsPageInstance
}

module.exports = skipComponents
