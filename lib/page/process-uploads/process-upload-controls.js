require('@ministryofjustice/module-alias/register-module')(module)

const debug = require('debug')
const error = debug('runner:process-components')

debug.enable('runner:*')

const proxyquire = require('proxyquire')

const makeMiddleware = require('./multer/lib/make-middleware')
const multer = proxyquire('multer', {
  './lib/make-middleware': makeMiddleware
})

const {UPLOADS_DIR} = require('~/fb-runner-node/constants/constants')

const {getString} = require('~/fb-runner-node/service-data/service-data')
const {format} = require('~/fb-runner-node/format/format')

async function processComponents (userData, components, expectedComponents) {
  return new Promise((resolve, reject) => {
    const {req} = userData
    const maxFileSize = Math.max(...components.map(control => control.maxSize), 0)

    const upload = multer({
      limits: {
        fileSize: maxFileSize
      },
      dest: UPLOADS_DIR
    })

    const componentFieldsParser = upload.fields(expectedComponents)

    // NB. passing null for res here

    componentFieldsParser(req, null, (err) => {
      if (err) error(err)

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
    })
  })
}

module.exports = processComponents
