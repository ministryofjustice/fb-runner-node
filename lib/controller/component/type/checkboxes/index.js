require('@ministryofjustice/module-alias/register-module')(module)

const AnyOfController = require('~/fb-runner-node/controller/component/common/any-of')

module.exports = class CheckboxesController extends AnyOfController {}
