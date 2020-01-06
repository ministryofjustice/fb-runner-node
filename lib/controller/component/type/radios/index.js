require('@ministryofjustice/module-alias/register-module')(module)

const CommonController = require('~/fb-runner-node/controller/component/common')

const {
  getInstanceTitleSummary
} = require('~/fb-runner-node/service-data/service-data')

const {
  format
} = require('~/fb-runner-node/format/format')

module.exports = class RadiosController extends CommonController {
  isAnswered ({name, items = []}, userData, scope) {
    const radioValue = userData.getUserDataInputProperty(name)

    return items.some(({value}) => value === radioValue)
  }

  getAnsweredDisplayValue ({name, items = [], ...instance}, userData, scope) {
    const radioValue = userData.getUserDataInputProperty(name)

    const {_id} = items.find(({value}) => value === radioValue)

    const value = getInstanceTitleSummary(_id)

    return format(value, {}, {multiline: this.isMultiLine({...instance, name, items}, value), substitution: true, markdown: true, lang: userData.contentLang})
  }
}
