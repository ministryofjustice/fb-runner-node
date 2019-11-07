require('module-alias/register')

const {PLATFORM_ENV} = require('~/constants/constants')
const {getServiceSchema} = require('~/service-data/service-data')

const {FBError} = require('@ministryofjustice/fb-utils-node')
class FBProcessInputError extends FBError {}

const processControlStandard = (pageInstance, userData, nameInstance, options) => {
  const {controlName} = options
  const logger = userData.logger
  const input = userData.getBodyInput()

  const {_type} = nameInstance

  let nameValue = input[controlName]

  if (Array.isArray(nameValue)) {
    logger.error({name: controlName}, 'Input name is not unique for the request')
    let renderError
    if (!PLATFORM_ENV) {
      renderError = {
        heading: `Input name ${controlName} is not unique`,
        lede: 'The form will not work correctly unless you fix this problem'
      }
    }
    throw new FBProcessInputError(`Input name ${controlName} is not unique`, {
      error: {
        code: 'EDUPLICATEINPUTNAME',
        renderError
      }
    })
  }

  if (!nameInstance.acceptsEmptyString) {
    if (nameValue) {
      nameValue = nameValue.trim()
    }
    if (nameValue === '') {
      nameValue = undefined
    }
  }

  const schema = getServiceSchema(_type)
  const nameSchema = schema.properties.name
  if (nameValue !== undefined && nameSchema.inputType === 'number') {
    const originalNumberValue = nameValue
    nameValue = Number(nameValue)
    if (isNaN(nameValue)) {
      nameValue = originalNumberValue
    }
  }

  return nameValue
}

module.exports = processControlStandard
