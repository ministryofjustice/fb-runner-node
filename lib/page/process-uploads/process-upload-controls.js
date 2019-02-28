// const multer = require('multer')
const multer = require('./multer/index')

const processUploadControls = async (userData, uploadControls, allowedUploadControls) => {
  return new Promise((resolve, reject) => {
    const {req} = userData
    const maxFileSize = Math.max(...uploadControls.map(control => control.maxSize), 0)

    const upload = multer({
      limits: {
        fileSize: maxFileSize
      },
      dest: '/tmp/uploads'
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
      resolve({
        files: req.files,
        fileErrors: req.bodyErrors.files
      })
      // Everything went fine.
    })
  })
}

module.exports = processUploadControls
