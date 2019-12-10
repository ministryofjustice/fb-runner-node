function getUploadPage ({getBodyInput}) {
  const {
    uploadPage
  } = getBodyInput()

  return uploadPage
}

async function preFlight (componentInstance, userData, {_id}) {
  const bodyInput = userData.getBodyInput()

  if (Reflect.has(bodyInput, 'fieldName')) userData.setUserDataProperty('fieldName', Reflect.get(bodyInput, 'fieldName'))

  userData.setUserDataProperty('uploadPage', _id)

  userData.unsetUserDataProperty('removeUpload')
  userData.unsetUserDataProperty('upload')

  return componentInstance
}

async function postValidation (componentInstance, userData, pageInstance) {
  userData.setUserDataProperty('uploadPage', getUploadPage(userData))

  return componentInstance
}

module.exports = {
  preFlight,
  postValidation
}
