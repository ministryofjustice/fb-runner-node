function getUploadPage ({getBodyInput}) {
  const {
    uploadPage
  } = getBodyInput()

  return uploadPage
}

async function preFlight (componentInstance, userData, {_id}) {
  console.log('lib/controller/component/type/upload:preFlight')

  userData.setUserDataProperty('uploadPage', _id)

  return componentInstance
}

async function setContents (componentInstance, userData, pageInstance) {
  console.log('lib/controller/component/type/upload:setContents()')

  return componentInstance
}

async function postValidation (componentInstance, userData, pageInstance) {
  console.log('lib/controller/component/type/upload:postValidation()')

  userData.setUserDataProperty('uploadPage', getUploadPage(userData))

  return componentInstance
}

async function preUpdateContents (componentInstance, userData, pageInstance) {
  console.log('lib/controller/component/type/upload:preUpdateContents()')

  return componentInstance
}

async function preRender (componentInstance, userData, pageInstance) {
  console.log('lib/controller/component/type/upload:preRender()')

  return componentInstance
}

module.exports = {
  preFlight,
  setContents,
  postValidation,
  preUpdateContents,
  preRender
}
