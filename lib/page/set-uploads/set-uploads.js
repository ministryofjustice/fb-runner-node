const bytes = require('bytes')

const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {getUploadControls} = require('../utils/utils-uploads')
const {getUploadMaxFiles, getUploadFileCount, getUploadFiles} = require('../utils/utils-uploads')

const {getString, getInstanceProperty} = require('../../service-data/service-data')
const {format} = require('../../format/format')

const flattenDeep = (arr) => {
  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), [])
}

const setUploadControls = async (pageInstance, userData) => {
  const {req} = userData
  pageInstance = deepClone(pageInstance)

  let uploadControls = getUploadControls(pageInstance)
  uploadControls.forEach(control => {
    // control.accept = ['image/jpeg', 'image/png', 'image/woo']
    let accept = control.accept
    let acceptHints = accept ? accept.slice() : []
    const resolveFileTypes = (accept) => {
      for (let index = accept.length - 1; index > -1; index--) {
        let filetype = accept[index]
        if (!filetype.includes('/')) {
          let types = getInstanceProperty(`filetype.${filetype}`, 'types', [])
          if (types.length) {
            filetype = resolveFileTypes(types)
          }
        }
        accept[index] = filetype
      }
      return flattenDeep(accept)
    }
    if (accept) {
      accept = resolveFileTypes(accept)
    }
    control.accept = accept

    if (!control.hint && acceptHints.length) {
      acceptHints.forEach((type, index, arr) => {
        let hintValue = getString(`fileupload.hint.type.${type.replace(/\//g, '.').replace(/\+/g, '.')}`, userData.contentLang)
        if (!hintValue) {
          hintValue = type.replace(/.*\//, '').replace(/\+.*/g, '')
          if (hintValue === '*') {
            hintValue = type.replace(/\/.*/, '')
          }
        }
        arr[index] = hintValue
      })
      control.acceptHints = acceptHints
      // control.hintTypes += format('{types, orconcat}', {types: acceptHints})
    }

    if (control.accept) {
      control.accept = control.accept.join(',')
    }
    const maxFiles = getUploadMaxFiles(control)
    const currentFiles = getUploadFiles(control, userData)
    const currentFileCount = getUploadFileCount(control, userData)
    const maxAvailableSlots = maxFiles - currentFileCount
    let slots = 0
    if (maxAvailableSlots) {
      let uploadSlots = req.body[`${control.name}_slots`] || 1
      const addFileInvoked = req.body.addFile === control.name
      if (addFileInvoked) {
        uploadSlots++
      }
      const successfulUploads = userData.getSuccessfulUploadsCount(control.name)
      uploadSlots = uploadSlots - successfulUploads
      slots = Math.min(uploadSlots, maxAvailableSlots)
      control.slots = slots
      if (slots < maxAvailableSlots) {
        control.addFile = true
      }
    }

    if (!control.hint) {
      if (control.maxFiles > 1) {
        let hintMaxFiles = getString('fileupload.hint.maxfiles', pageInstance.contentLang)
        hintMaxFiles = format(hintMaxFiles, {count: control.maxFiles})
        control.hint = hintMaxFiles
      }
      if (control.acceptHints) {
        let hintAccept = getString('fileupload.hint.accept', pageInstance.contentLang)
        hintAccept = format(hintAccept, {types: control.acceptHints})
        // control.hint = control.hint ? `${control.hint}  \n` : ''
        control.hint = control.hint ? `${control.hint}\n\n` : ''
        control.hint += hintAccept
      }
      let hintMaxSize = getString('fileupload.hint.maxsize', pageInstance.contentLang)
      hintMaxSize = format(hintMaxSize, {maxsize: bytes(control.maxSize), count: control.maxFiles})
      // control.hint = control.hint ? `${control.hint}  \n` : ''
      control.hint = control.hint ? `${control.hint}\n\n` : ''
      control.hint += hintMaxSize
    }
    if (slots) {
      let uploadExplanation = getString('fileupload.hint.timing', pageInstance.contentLang)
      uploadExplanation = format(uploadExplanation, {count: slots})
      // control.hint += '  \n'
      control.hint += '\n\n'
      control.hint += uploadExplanation
    }

    const fileRemoveText = getString('fileupload.file.remove', pageInstance.contentLang)
    const slotLabel = getString('fileupload.slot.label', pageInstance.contentLang)
    control.fileCount = currentFileCount
    for (let slot = 1; slot <= slots; slot++) {
      control.fileUploads = control.fileUploads || []

      const fileUpload = {
        $skipValidation: true,
        $originalName: control.name,
        name: `${control.name}[${slot}]`
      }
      if (slots > 1) {
        fileUpload.label = format(slotLabel, {count: slot})
      } else if (maxFiles === 1) {
        fileUpload.label = control.label
        fileUpload.hint = control.hint
      }

      control.fileUploads.push(fileUpload)
    }
    const summaryList = currentFiles.map((file, index) => {
      let size = bytes(file.size)
      size = size.replace(/\.\d+/, '')
      let filetype = getString(`fileupload.file.type.${file.mimetype.replace(/\//g, '.').replace(/\+/g, '.')}`)
      if (!filetype) {
        filetype = file.mimetype.replace(/.*\//, '').replace(/\+.*/g, '')
      }
      const listItem = {
        key: {
          html: `${file.originalname} (${filetype}, ${size})`,
          classes: 'fb-summary-list--file-key'
        },
        actions: {
          items: [
            {
              name: 'removeFile',
              value: `${control.name}:${file.uuid}`,
              html: fileRemoveText,
              classes: 'fb-action-secondary fb-action--delete',
              visuallyHiddenText: file.originalname
            }
          ]
        }}
      return listItem
    })
    control.summaryList = summaryList
    if (summaryList.length) {
      let summaryListHeading = getString('fileupload.files.heading', pageInstance.contentLang)
      summaryListHeading = format(summaryListHeading, {count: summaryList.length})
      control.summaryListHeading = summaryListHeading
    }
  })

  return pageInstance
}

module.exports = setUploadControls
