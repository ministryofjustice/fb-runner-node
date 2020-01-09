require('@ministryofjustice/module-alias/register-module')(module)

const CommonController = require('~/fb-runner-node/controller/component/common')

const {
  getInstanceTitleSummary
} = require('~/fb-runner-node/service-data/service-data')

const {
  format
} = require('~/fb-runner-node/format/format')

module.exports = class OneOfController extends CommonController {
  isAnswered ({name, items = []}, userData, scope) {
    const oneOfValue = userData.getUserDataInputProperty(name)

    return items.some(({value}) => value === oneOfValue)
  }

  getAnsweredDisplayValue ({name, items = [], ...instance}, userData, scope) {
    const oneOfValue = userData.getUserDataInputProperty(name)

    const {_id} = items.find(({value}) => value === oneOfValue)

    const value = getInstanceTitleSummary(_id)

    return format(value, {}, {multiline: this.isMultiLine({...instance, name, items}, value), substitution: true, markdown: true, lang: userData.contentLang})
  }
}
