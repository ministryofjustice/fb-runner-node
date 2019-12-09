require('@ministryofjustice/module-alias/register-module')(module)

const {
  getUploadControls,
  getUploadMaxFiles,
  getUploadMinFiles,
  getUploadMaxSize,
  getUploadFileCount,
  getUploadFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const {
  getString,
  getInstanceProperty
} = require('~/fb-runner-node/service-data/service-data')

const {format} = require('~/fb-runner-node/format/format')

const flattenDeep = (arr = []) => arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), [])

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

module.exports = async function setUploadControls (pageInstance, userData) {
  const uploadControls = getUploadControls(pageInstance)

  uploadControls
    .filter(({_type}) => _type === 'upload')
    .forEach(control => {
      const maxFiles = getUploadMaxFiles(control)
      const minFiles = getUploadMinFiles(control)
      const maxSize = getUploadMaxSize(control)
      const currentFiles = getUploadFiles(control, userData)
      const currentFileCount = getUploadFileCount(control, userData)
      const maxAvailableSlots = maxFiles - currentFileCount

      const {
        _id: uploadPage
      } = pageInstance

      console.log({
        maxFiles,
        minFiles,
        maxSize,
        currentFileCount
      })

      if (Array.isArray(control.accept)) {
        const accept = control.accept.slice() // copy
        control.accept = resolveFileTypes(accept) // from copy to field
        if (!control.hint) control.acceptHints = getAcceptHints(accept, userData) // from copy to field
        control.accept = control.accept.join(',') // from field to field
      }

      if (!control.hint) {
        const hint = getString('upload.hint', userData.contentLang)

        const {
          acceptHints
        } = control

        control.hint = format(hint, {
          maxfiles: maxFiles,
          maxsize: maxSize,
          types: acceptHints
        }, {
          markdown: false,
          lang: userData.contentLang
        }).trim()
      }

      if (maxAvailableSlots) {
        console.log(`

          MAX AVAILABLE SLOTS

`)

        const {
          [`${control.name}_slots`]: uploadSlots = 1
        } = userData.getBodyInput()

        const availableSlots = Math.max(uploadSlots, minFiles) - currentFileCount // userData.getSuccessfulUploadsCount(control.name)

        console.log('?', currentFileCount, userData.getSuccessfulUploadsCount(control.name), Math.min(availableSlots, maxAvailableSlots))

        control.slots = Math.min(availableSlots, maxAvailableSlots)
      }

      const {
        fileUploads = [],
        slots = 0
      } = control

      for (let slot = 0; slot < slots; slot++) {
        const count = slot + 1
        const {
          name,
          hint,
          label
        } = control

        fileUploads.push({
          $skipValidation: true,
          $originalName: name,
          name: `${name}[${count}]`,
          hint,
          label
        })
      }

      fileUploads
        .sort(({timestamp: alpha}, {timestamp: omega}) => new Date(alpha).valueOf() - new Date(omega).valueOf())

      const [
        fileUpload
      ] = fileUploads.slice().reverse()

      control.files = currentFiles.map(({uuid}) => uuid)
      control.fileCount = currentFileCount
      control.fileUploads = fileUploads
      control.fileUpload = fileUpload
      control.uploadPage = uploadPage
    })

  return pageInstance
}
