require('@ministryofjustice/module-alias/register-module')(module)

const {
  getUploadControls,
  getUploadedMaxFiles,
  getUploadedMinFiles,
  getUploadedMaxSize,
  getUploadedFileCount,
  getUploadedFiles,
  hasUploadedMaxFiles,
  hasUploadedMinFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const {
  getUploadFieldName
} = require('~/fb-runner-node/page/utils/utils-controls')

const {
  getString,
  getInstanceProperty
} = require('~/fb-runner-node/service-data/service-data')

const {
  format
} = require('~/fb-runner-node/format/format')

const flattenDeep = (arr = []) => arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), [])

function getFieldName (userData, controlName, maxFiles) {
  const {
    accepted = []
  } = userData.getUserData()

  /*
   *  Find the first available, or take the last
   */
  let i = 1
  while (i < maxFiles && accepted.some(({fieldName}) => fieldName === getUploadFieldName(controlName, i))) i++
  return getUploadFieldName(controlName, i)
}

const resolveFileTypes = (accept) => flattenDeep(accept.map((type) => {
  if (!type.includes('/')) {
    const types = getInstanceProperty(`filetype.${type}`, 'types') || []

    if (types.length) {
      type = resolveFileTypes(types)
    }
  }

  return type
}))

function getAcceptHints (accept = [], {contentLang}) {
  return accept.reduce((accumulator, type) => {
    let mimeType = type // Convert slashes and pluses to dots - eg. image/svg+xml => image.svg.xml
      .replace(/\//g, '.')
      .replace(/\+/g, '.')

    let hint = getString(`upload.hint.type.${mimeType}`, contentLang)

    if (!hint) { // Strip string before slash - eg. image/svg+xml => svg.xml
      mimeType = type
        .replace(/.*\//, '')
        .replace(/\+.*/g, '')

      if (mimeType === '*') { // Wildcard - revert to string before slash - eg. image/* => image
        mimeType = type
          .replace(/\/.*/, '')
      }

      hint = getString(`upload.hint.type.${mimeType}`, contentLang) || mimeType
    }

    return accumulator.concat(hint)
  }, [])
}

const trim = (text) => {
  while (/\n{3}/.test(text)) text = text.replace(/\n{3}/g, '\n\n')
  return text.trim()
}

module.exports = async function setUploadControls (pageInstance, userData) {
  getUploadControls(pageInstance)
    .filter(({_type}) => _type === 'upload')
    .forEach((control) => {
      const maxFiles = getUploadedMaxFiles(control)
      const minFiles = getUploadedMinFiles(control)
      const maxSize = getUploadedMaxSize(control)
      const currentFiles = getUploadedFiles(control, userData)
      const currentFileCount = getUploadedFileCount(control, userData)

      if (Array.isArray(control.accept)) {
        const accept = control.accept.slice() // copy
        control.accept = resolveFileTypes(accept) // from copy to field
        if (!control.hint) control.acceptHints = getAcceptHints(accept, userData) // from copy to field
        control.accept = control.accept.join(',') // from field to field
      }

      if (!control.hint) {
        const {
          acceptHints
        } = control

        control.hint = trim(
          format(
            getString('upload.hint', userData.contentLang),
            {
              maxfiles: maxFiles,
              minfiles: minFiles,
              maxsize: maxSize,
              types: acceptHints
            }, {
              markdown: false,
              lang: userData.contentLang
            }
          )
        )
      }

      const {
        name,
        hint,
        label
      } = control

      const fieldName = getFieldName(userData, name, maxFiles)

      const fileUpload = {
        $skipValidation: true,
        $originalName: name,
        name: fieldName,
        hint,
        label
      }

      control.files = currentFiles.map(({uuid}) => uuid)
      control.fileCount = currentFileCount
      control.fileUpload = fileUpload
      control.fieldName = fieldName
      control.hasMaxFiles = hasUploadedMaxFiles(control, userData)
      control.hasMinFiles = hasUploadedMinFiles(control, userData)
    })

  const {
    _id: uploadPage
  } = pageInstance

  pageInstance.uploadPage = uploadPage

  return pageInstance
}
