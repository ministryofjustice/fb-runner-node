const bytes = require('bytes')

const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {getUploadControls} = require('../utils/utils-uploads')
const {getUploadMaxFiles, getUploadFileCount, getUploadFiles} = require('../utils/utils-uploads')

const setUploadControls = async (pageInstance, userData) => {
  const {req} = userData
  pageInstance = deepClone(pageInstance)

  let uploadControls = getUploadControls(pageInstance)
  uploadControls.forEach(control => {
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
    control.fileCount = currentFileCount
    for (let slot = 1; slot <= slots; slot++) {
      control.fileUploads = control.fileUploads || []
      const fileUpload = Object.assign({
        $skipValidation: true,
        $originalName: control.name
      }, deepClone(control), {
        name: `${control.name}[${slot}]`
      })
      delete fileUpload._type
      control.fileUploads.push(fileUpload)
    }
    const summaryList = currentFiles.map(file => {
      const size = bytes(file.size)
      const listItem = {
        key: {
          html: `${file.originalname},${file.mimetype}, ${size}`
        },
        value: {
          html: `<button type="submit" class="govuk-button fb-action-secondary fb-action--delete" name="removeFile" value="${control.name}:${file.uuid}">Delete</button>`
        },
        inactions: {
          items: [
            {
              href: 'woo',
              html: `<button class="govuk-button fb-action-secondary fb-action--delete" name="removeFile" value="${control.name}:${file.uuid}">Delete</button>`,
              visuallyHiddenText: 'summit'
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
