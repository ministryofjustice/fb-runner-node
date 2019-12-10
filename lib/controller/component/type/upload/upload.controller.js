function getUploadPage ({getBodyInput}) {
  const {
    uploadPage
  } = getBodyInput()

  return uploadPage
}

async function preFlight (componentInstance, userData, {_id}) {
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
