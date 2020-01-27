require('@ministryofjustice/module-alias/register-module')(module)

const { getComponents } = require('~/fb-runner-node/page/utils/utils-uploads')

module.exports = async function setMultipartForm (pageInstance, userData) {
  const uploadControls = getComponents(pageInstance)

  /**
   * All upload controls
   */
  const encType = !!uploadControls.length
  const { req } = userData

  if (req.method === 'POST') {
    const contentType = req.get('content-type')
    if (encType) {
      if (!contentType || !contentType.startsWith('multipart/form-data;')) {
        throw new Error(400)
      }
    } else {
      if (contentType !== 'application/x-www-form-urlencoded') {
        throw new Error(400)
      }
    }
  }

  if (encType) {
    pageInstance.encType = true
  }

  return pageInstance
}
