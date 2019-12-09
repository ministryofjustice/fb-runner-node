async function preFlight (componentInstance, userData, pageInstance) {
  console.log('lib/controller/component/type/fileupload:preFlight()')

  return componentInstance
}

async function setContents (componentInstance, userData, pageInstance) {
  console.log('lib/controller/component/type/fileupload:setContents()')

  return componentInstance
}

async function postValidation (componentInstance, userData, pageInstance) {
  console.log('lib/controller/component/type/fileupload:postValidation()')

  return componentInstance
}

async function preUpdateContents (componentInstance, userData, pageInstance) {
  console.log('lib/controller/component/type/fileupload:preUpdateContents()')

  return componentInstance
}

async function preRender (componentInstance, userData, pageInstance) {
  console.log('lib/controller/component/type/fileupload:preRender()')

  return componentInstance
}

module.exports = {
  preFlight,
  setContents,
  postValidation,
  preUpdateContents,
  preRender
}
