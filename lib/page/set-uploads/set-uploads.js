const bytes = require('bytes')

const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {getUploadControls} = require('../utils/utils-uploads')
const {getUploadMaxFiles, getUploadFileCount, getUploadFiles} = require('../utils/utils-uploads')

const {getString} = require('../../service-data/service-data')
const {format} = require('../../format/format')

const setUploadControls = async (pageInstance, userData) => {
  const {req} = userData
  pageInstance = deepClone(pageInstance)

  let uploadControls = getUploadControls(pageInstance)
  uploadControls.forEach(control => {
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
      const size = bytes(file.size)
      const listItem = {
        xkey: {
          html: `File ${index + 1}`
        },
        key: {
          html: `${file.originalname},${file.mimetype}, ${size}`,
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
  })

  return pageInstance
}

module.exports = setUploadControls
