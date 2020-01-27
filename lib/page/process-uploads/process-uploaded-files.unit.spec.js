const test = require('tape')
const sinon = require('sinon')
const processComponentFiles = require('./process-uploaded-files')

const fileUploadControl = [{
  _type: 'fileupload',
  name: 'test',
  validation: {
    maxSize: 10 * 1024 * 1024
  }
}]

const uploadControl = [{
  _type: 'upload',
  name: 'test',
  validation: {
    maxSize: 10 * 1024 * 1024
  }
}]

const uploadedFiles = {
  files: {
    'test[1]': [
      {
        fieldname: 'test[1]',
        originalname: 'originalname',
        size: 10 * 1024 * 1024,
        maxSize: 10485760,
        expires: undefined
      }
    ]
  }
}

const pageInstance = {}
const userData = { getUserDataProperty: () => sinon.stub().returns([]), getBodyInput: () => sinon.stub().returns({}) }

test('The `accept` property is not present (fileupload)', async t => {
  const {
    files
  } = await processComponentFiles(pageInstance, userData, uploadedFiles, fileUploadControl)

  t.deepEqual(files.allowed_types, undefined, '`allowed_types` is undefined')

  t.end()
})

test('The `accept` property is not present (upload)', async t => {
  const {
    files
  } = await processComponentFiles(pageInstance, userData, uploadedFiles, uploadControl)

  t.deepEqual(files.allowed_types, undefined, '`allowed_types` is undefined')

  t.end()
})

test('The `accept` property is an array (fileupload)', async t => {
  const fileUploadControlWithoutAccept = [{
    _type: 'fileupload',
    name: 'test',
    maxFiles: 1,
    minFiles: 1,
    maxSize: 10 * 1024 * 1024,
    validation: {
      accept: []
    }
  }]

  const {
    files
  } = await processComponentFiles(pageInstance, userData, uploadedFiles, fileUploadControlWithoutAccept)

  t.deepEqual(files.allowed_types, undefined, '`allowed_types` is undefined')

  t.end()
})

test('The `accept` property is an array (upload)', async t => {
  const uploadControlWithoutAccept = [{
    _type: 'upload',
    name: 'test',
    maxFiles: 1,
    minFiles: 1,
    maxSize: 10 * 1024 * 1024,
    validation: {
      accept: []
    }
  }]

  const {
    files
  } = await processComponentFiles(pageInstance, userData, uploadedFiles, uploadControlWithoutAccept)

  t.deepEqual(files.allowed_types, undefined, '`allowed_types` is undefined')

  t.end()
})

test('The `accept` property is an array of mimetypes (fileupload)', async t => {
  const fileUploadControlWithAccept = [{
    _type: 'fileupload',
    name: 'test',
    maxFiles: 1,
    minFiles: 1,
    maxSize: 10 * 1024 * 1024,
    validation: {
      accept: ['application/pdf', 'image/png']
    }
  }]

  const {
    files: {
      'test[1]': [
        file
      ]
    }
  } = await processComponentFiles(pageInstance, userData, uploadedFiles, fileUploadControlWithAccept)

  t.deepEqual(file.allowed_types, ['application/pdf', 'image/png'], '`allowed_types` is an array of mimetypes')

  t.end()
})

test('The `accept` property is an array of mimetypes (upload)', async t => {
  const uploadControlWithAccept = [{
    _type: 'upload',
    name: 'test',
    maxFiles: 1,
    minFiles: 1,
    maxSize: 10 * 1024 * 1024,
    validation: {
      accept: ['application/pdf', 'image/png']
    }
  }]

  const {
    files: {
      'test[1]': [
        file
      ]
    }
  } = await processComponentFiles(pageInstance, userData, uploadedFiles, uploadControlWithAccept)

  t.deepEqual(file.allowed_types, ['application/pdf', 'image/png'], '`allowed_types` is an array of mimetypes')

  t.end()
})

test('When an uploaded file is valid', async t => {
  const uploadedFilesWithoutFileErrors = {
    files: {
      'test[1]': [
        {
          fieldname: 'test[1]',
          originalname: 'originalname',
          size: 10 * 1024 * 1024,
          maxFiles: 1,
          minFiles: 1,
          maxSize: 10485760,
          expires: undefined,
          allowed_types: undefined
        }
      ]
    }
  }

  const uploadedFilesWithErrors = {
    files: {
      'test[1]': [
        {
          fieldname: 'test[1]',
          originalname: 'originalname',
          size: 10 * 1024 * 1024,
          maxFiles: 1,
          minFiles: 1,
          maxSize: 10485760,
          expires: undefined,
          allowed_types: undefined
        }
      ]
    },
    fileErrors: {
      maxSize: [
        {
          fieldname: 'test[2]',
          originalname: 'originalname'
        }
      ]
    }
  }

  {
    const {
      files,
      fileErrors
    } = await processComponentFiles(pageInstance, userData, uploadedFilesWithoutFileErrors, fileUploadControl)

    t.deepEqual(files, uploadedFilesWithoutFileErrors.files, 'returns the `files` property of the uploaded files object')
    t.deepEqual(fileErrors, {}, 'returns an object when the `fileErrors` property of the uploaded files object does not exist')
  }

  {
    const {
      files,
      fileErrors
    } = await processComponentFiles(pageInstance, userData, uploadedFilesWithoutFileErrors, uploadControl)

    t.deepEqual(files, uploadedFilesWithoutFileErrors.files, 'returns the `files` property of the uploaded files object')
    t.deepEqual(fileErrors, {}, 'returns an object when the `fileErrors` property of the uploaded files object does not exist')
  }

  {
    const {
      files,
      fileErrors
    } = await processComponentFiles(pageInstance, userData, uploadedFilesWithErrors, fileUploadControl)

    t.deepEqual(files, uploadedFilesWithErrors.files, 'returns the `files` property of the uploaded files object')
    t.deepEqual(fileErrors, uploadedFilesWithErrors.fileErrors, 'returns the `fileErrors` property of the uploaded files object')
  }

  {
    const {
      files,
      fileErrors
    } = await processComponentFiles(pageInstance, userData, uploadedFilesWithErrors, uploadControl)

    t.deepEqual(files, uploadedFilesWithErrors.files, 'returns the `files` property of the uploaded files object')
    t.deepEqual(fileErrors, uploadedFilesWithErrors.fileErrors, 'returns the `fileErrors` property of the uploaded files object')
  }

  t.end()
})

test('When an uploaded file is not valid', async t => {
  {
    const uploadedFiles = {
      files: {
        'test[1]': [
          {
            fieldname: 'test[1]',
            originalname: 'originalname',
            size: 10 * 1024 * 1024 + 1
          }
        ]
      }
    }

    const {
      files,
      fileErrors
    } = await processComponentFiles(pageInstance, userData, uploadedFiles, fileUploadControl)

    t.deepEqual(files, {}, 'removes the invalid file from the `files` object')
    t.deepEqual(fileErrors, {
      maxSize: [
        {
          fieldname: 'test[1]',
          originalname: 'originalname',
          size: 10 * 1024 * 1024 + 1,
          maxFiles: 1,
          minFiles: 1,
          maxSize: 10 * 1024 * 1024,
          expires: undefined,
          allowed_types: undefined
        }
      ]
    }, 'adds an error object to the `maxSize` error collection')
  }

  {
    const uploadedFiles = {
      files: {
        'test[1]': [
          {
            fieldname: 'test[1]',
            originalname: 'originalname',
            size: 10 * 1024 * 1024 + 1
          }
        ]
      }
    }

    const {
      files,
      fileErrors
    } = await processComponentFiles(pageInstance, userData, uploadedFiles, uploadControl)

    t.deepEqual(files, {}, 'removes the invalid file from the `files` object')
    t.deepEqual(fileErrors, {
      maxSize: [
        {
          fieldname: 'test[1]',
          originalname: 'originalname',
          size: 10 * 1024 * 1024 + 1,
          maxFiles: 1,
          minFiles: 1,
          maxSize: 10 * 1024 * 1024,
          expires: undefined,
          allowed_types: undefined
        }
      ]
    }, 'adds an error object to the `maxSize` error collection')
  }

  t.end()
})
