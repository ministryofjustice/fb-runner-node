const bytes = require('bytes')

const {getNormalisedUploadControlName} = require('../utils/utils-controls')
const {
  getUploadControls,
  getUploadMaxFiles,
  getUploadMinFiles,
  getUploadFileCount,
  getUploadFiles
} = require('../utils/utils-uploads')

const {
  getString,
  getInstanceProperty
} = require('../../service-data/service-data')
const {format} = require('../../format/format')

const flattenDeep = (arr) => {
  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), [])
}

const setUploadControls = async (pageInstance, userData) => {
  const uploadControls = getUploadControls(pageInstance)
  uploadControls.forEach(control => {
    let accept = control.accept
    const acceptHints = accept ? accept.slice() : undefined

    const resolveFileTypes = (accept) => {
      const resolvedAccept = accept.map(type => {
        if (!type.includes('/')) {
          const types = getInstanceProperty(`filetype.${type}`, 'types') || []
          if (types.length) {
            type = resolveFileTypes(types)
          }
        }
        return type
      })
      return flattenDeep(resolvedAccept)
    }

    if (accept) {
      accept = resolveFileTypes(accept)
    }
    control.accept = accept

    if (!control.hint && acceptHints) {
      acceptHints.forEach((type, index, arr) => {
        // Convert slashes and pluses to dots - eg. image/svg+xml => image.svg.xml
        let typeLookup = type.replace(/\//g, '.').replace(/\+/g, '.')
        let hintValue = getString(`fileupload.hint.type.${typeLookup}`, userData.contentLang)
        if (!hintValue) {
          // Strip string before slash - eg. image/svg+xml => svg.xml
          typeLookup = type.replace(/.*\//, '').replace(/\+.*/g, '')
          if (typeLookup === '*') {
            // Wildcard - revert to string before slash - eg. image/* => image
            typeLookup = type.replace(/\/.*/, '')
          }
          hintValue = getString(`fileupload.hint.type.${typeLookup}`, userData.contentLang) || typeLookup
        }
        arr[index] = hintValue
      })
      control.acceptHints = acceptHints
    }

    if (control.accept) {
      control.accept = control.accept.join(',')
    }
    const maxFiles = getUploadMaxFiles(control)
    const minFiles = getUploadMinFiles(control)
    const currentFiles = getUploadFiles(control, userData)
    const currentFileCount = getUploadFileCount(control, userData)
    const maxAvailableSlots = maxFiles - currentFileCount
    let slots = 0
    if (maxAvailableSlots) {
      const body = userData.getBodyInput()
      const {addFile, removeSlot} = body
      let uploadSlots = body[`${control.name}_slots`] || 1
      const addFileInvoked = addFile === control.name
      if (addFileInvoked) {
        uploadSlots++
      }
      if (removeSlot) {
        const removeSlotInvoked = getNormalisedUploadControlName(removeSlot) === control.name
        if (removeSlotInvoked) {
          uploadSlots--
        }
      }
      uploadSlots = Math.max(uploadSlots, minFiles)
      const successfulUploads = userData.getSuccessfulUploadsCount(control.name)
      uploadSlots = uploadSlots - successfulUploads
      slots = Math.min(uploadSlots, maxAvailableSlots)
      control.slots = slots
      if (slots < maxAvailableSlots) {
        control.addFile = getString('fileupload.file.button.add', userData.contentLang)
      }
    }

    if (!control.hint) {
      let controlHintString = getString('fileupload.hint', userData.contentLang)
      controlHintString = format(controlHintString, {
        maxfiles: control.maxFiles || 1,
        maxsize: control.maxSize,
        types: control.acceptHints
      }, {
        markdown: false,
        lang: userData.contentLang
      })
      control.hint = controlHintString
    }

    if (slots) {
      let uploadExplanation = getString('fileupload.hint.timing', userData.contentLang)
      if (uploadExplanation) {
        uploadExplanation = format(uploadExplanation, {
          count: slots
        }, {
          markdown: false,
          lang: userData.contentLang
        })
        control.hint += '\n\n'
        control.hint += uploadExplanation
      }
    }

    const fileDescription = getString('fileupload.file.description', userData.contentLang)
    const fileRemoveText = getString('fileupload.file.button.remove', userData.contentLang)
    const slotLabel = getString('fileupload.slot.label', userData.contentLang)
    const removeSlotText = getString('fileupload.slot.button.remove', userData.contentLang)
    control.fileCount = currentFileCount
    for (let slot = 1; slot <= slots; slot++) {
      control.fileUploads = control.fileUploads || []

      const fileUpload = {
        $skipValidation: true,
        $originalName: control.name,
        name: `${control.name}[${slot}]`
      }
      if (slots > 1) {
        fileUpload.label = format(slotLabel, {count: slot}, {lang: userData.contentLang})
        fileUpload.removeSlot = format(removeSlotText, {label: fileUpload.label}, {lang: userData.contentLang})
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
      const listItemDescription = format(fileDescription, {
        filename: file.originalname,
        filetype,
        size
      }, {lang: userData.contentLang})
      const listItem = {
        key: {
          html: listItemDescription,
          classes: 'fb-summary-list--file-key'
        },
        actions: {
          items: [
            {
              name: 'removeFile',
              value: `${control.name}:${file.uuid}`,
              html: fileRemoveText,
              classes: 'govuk-button--secondary fb-action--delete',
              visuallyHiddenText: file.originalname
            }
          ]
        }
      }
      return listItem
    })
    control.summaryList = summaryList
    if (summaryList.length) {
      let summaryListHeading = getString('fileupload.files.heading', userData.contentLang)
      summaryListHeading = format(summaryListHeading, {count: summaryList.length}, {lang: userData.contentLang})
      control.summaryListHeading = summaryListHeading
    }
  })

  return pageInstance
}

module.exports = setUploadControls
