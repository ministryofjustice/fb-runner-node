const proxyquire = require('proxyquire')

const makeMiddleware = require('./multer/lib/make-middleware')
const multer = proxyquire('multer', {
  './lib/make-middleware': makeMiddleware
})

const {UPLOADS_DIR} = require('../../constants/constants')

const {getString} = require('../../service-data/service-data')
const {format} = require('../../format/format')

const processUploadControls = async (userData, uploadControls, allowedUploadControls) => {
  return new Promise((resolve, reject) => {
    const {req} = userData
    const maxFileSize = Math.max(...uploadControls.map(control => control.maxSize), 0)

    const upload = multer({
      limits: {
        fileSize: maxFileSize
      },
      dest: UPLOADS_DIR
    })
    const uploadFieldsParser = upload.fields(allowedUploadControls)
    // NB. passing null for res here
    uploadFieldsParser(req, null, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
      } else if (err) {
        // An unknown error occurred when uploading.
      }
      userData.setBodyInput(req.body)

      // any file to delete?
      const {removeFile} = userData.getBodyInput()
      if (removeFile) {
        const [name, uuid] = removeFile.split(':')
        const files = userData.getUserDataProperty(name) || []
        const fileToRemove = files.filter(file => file.uuid === uuid)[0]
        if (fileToRemove) {
          const updatedFiles = files.filter(file => file.uuid !== uuid)
          if (!updatedFiles.length) {
            userData.unsetUserDataProperty(name)
          } else {
            userData.setUserDataProperty(name, updatedFiles)
          }
          let removeMessage = getString('flash.file.removed', userData.contentLang)
          removeMessage = format(removeMessage, {filename: fileToRemove.originalname}, {lang: userData.contentLang})
          userData.setFlashMessage({
            type: 'file.removed',
            html: removeMessage
          })
        }
      }

      resolve({
        files: req.files,
        fileErrors: req.bodyErrors.files
      })
      // Everything went fine.
    })
  })
}

module.exports = processUploadControls
