const {getNormalisedUploadControlName} = require('../utils/utils')
const fs = require('fs')

const uploadToFileStore = async (file) => {
  return new Promise((resolve, reject) => {
    // if (error) {
    //   reject({value
    //     file,
    //     error
    //   })
    // }
    resolve({
      file,
      value: {
        timestamp: new Date().toString()
      }
    })
  })
}

const storeUploadedFiles = async (userData, uploadedResults) => {
  const {files, fileErrors} = uploadedResults
  // const reflect = p => {
  //   return p.then(result => ({value: result, status: 'resolved'}), error => ({value: error, status: 'rejected'}))
  // }

  const filePromises = Object.keys(files).map(fieldname => {
    return uploadToFileStore(files[fieldname][0])
  })
  // Promise.all(filePromises.map(p => p.catch(e => e))).then...
  // .map(reflect)
  return Promise.all(filePromises).then((results) => {
    // console.log(JSON.stringify(results, null, 2))
    results.forEach(result => {
      let {file, error, value} = result
      if (error) {
        // TODO: add error handling
      } else {
        const data = Object.assign({}, file, value)
        const {fieldname} = file
        const realFieldName = getNormalisedUploadControlName(fieldname)
        let filesArray = userData.getUserDataProperty(realFieldName) || []
        filesArray = filesArray.slice()
        filesArray.push(data)
        userData.setUserDataProperty(realFieldName, filesArray)
        // TODO: set flash value for file
      }
      fs.unlink(file.path, () => {})
    })
    return fileErrors
  })
}

module.exports = storeUploadedFiles
