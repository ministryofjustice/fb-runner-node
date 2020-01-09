require('@ministryofjustice/module-alias/register-module')(module)

const OneOfController = require('~/fb-runner-node/controller/component/common/one-of')

module.exports = class SelectController extends OneOfController {}
