const test = require('tape')

const processUploadedFiles = require('./process-uploaded-files')

const fileUploadControl = [{
  _type: 'fileupload',
  name: 'test',
  validation: {
    maxSize: 10 * 1024 * 1024
  }
}]

const mojUploadControl = [{
  _type: 'mojupload',
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

test('The `accept` property is not present (fileupload)', async t => {
  const {
    files
  } = await processUploadedFiles(uploadedFiles, fileUploadControl)

  t.deepEqual(files.allowed_types, undefined, '`allowed_types` is undefined')

  t.end()
})

test('The `accept` property is not present (mojUpload)', async t => {
  const {
    files
  } = await processUploadedFiles(uploadedFiles, mojUploadControl)

  t.deepEqual(files.allowed_types, undefined, '`allowed_types` is undefined')

  t.end()
})

test('The `accept` property is an array (fileupload)', async t => {
  const fileUploadControlWithoutAccept = [{
    _type: 'fileupload',
    name: 'test',
    maxSize: 10 * 1024 * 1024,
    validation: {
      accept: []
    }
  }]

  const {
    files
  } = await processUploadedFiles(uploadedFiles, fileUploadControlWithoutAccept)

  t.deepEqual(files.allowed_types, undefined, '`allowed_types` is undefined')

  t.end()
})

test('The `accept` property is an array (mojUpload)', async t => {
  const mojUploadControlWithoutAccept = [{
    _type: 'mojUpload',
    name: 'test',
    maxSize: 10 * 1024 * 1024,
    validation: {
      accept: []
    }
  }]

  const {
    files
  } = await processUploadedFiles(uploadedFiles, mojUploadControlWithoutAccept)

  t.deepEqual(files.allowed_types, undefined, '`allowed_types` is undefined')

  t.end()
})

test('The `accept` property is an array of mimetypes (fileupload)', async t => {
  const fileUploadControlWithAccept = [{
    _type: 'fileupload',
    name: 'test',
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
  } = await processUploadedFiles(uploadedFiles, fileUploadControlWithAccept)

  t.deepEqual(file.allowed_types, ['application/pdf', 'image/png'], '`allowed_types` is an array of mimetypes')

  t.end()
})

test('The `accept` property is an array of mimetypes (mojUpload)', async t => {
  const mojUploadControlWithAccept = [{
    _type: 'mojUpload',
    name: 'test',
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
  } = await processUploadedFiles(uploadedFiles, mojUploadControlWithAccept)

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
    } = await processUploadedFiles(uploadedFilesWithoutFileErrors, fileUploadControl)

    t.deepEqual(files, uploadedFilesWithoutFileErrors.files, 'returns the `files` property of the uploaded files object')
    t.deepEqual(fileErrors, {}, 'returns an object when the `fileErrors` property of the uploaded files object does not exist')
  }

  {
    const {
      files,
      fileErrors
    } = await processUploadedFiles(uploadedFilesWithoutFileErrors, mojUploadControl)

    t.deepEqual(files, uploadedFilesWithoutFileErrors.files, 'returns the `files` property of the uploaded files object')
    t.deepEqual(fileErrors, {}, 'returns an object when the `fileErrors` property of the uploaded files object does not exist')
  }

  {
    const {
      files,
      fileErrors
    } = await processUploadedFiles(uploadedFilesWithErrors, fileUploadControl)

    t.deepEqual(files, uploadedFilesWithErrors.files, 'returns the `files` property of the uploaded files object')
    t.deepEqual(fileErrors, uploadedFilesWithErrors.fileErrors, 'returns the `fileErrors` property of the uploaded files object')
  }

  {
    const {
      files,
      fileErrors
    } = await processUploadedFiles(uploadedFilesWithErrors, mojUploadControl)

    t.deepEqual(files, uploadedFilesWithErrors.files, 'returns the `files` property of the uploaded files object')
    t.deepEqual(fileErrors, uploadedFilesWithErrors.fileErrors, 'returns the `fileErrors` property of the uploaded files object')
  }

  t.end()
})

test('When an uploaded file is not valid', async t => {
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

  {
    const {
      files,
      fileErrors
    } = await processUploadedFiles(uploadedFiles, fileUploadControl)

    t.deepEqual(files, {}, 'removes the invalid file from the `files` object')
    t.deepEqual(fileErrors, {
      maxSize: [
        {
          fieldname: 'test[1]',
          originalname: 'originalname',
          size: 10 * 1024 * 1024 + 1,
          maxSize: 10 * 1024 * 1024,
          expires: undefined,
          allowed_types: undefined
        }
      ]
    }, 'adds an error object to the `maxSize` error collection')
  }

  {
    const {
      files,
      fileErrors
    } = await processUploadedFiles(uploadedFiles, mojUploadControl)

    t.deepEqual(files, {}, 'removes the invalid file from the `files` object')
    t.deepEqual(fileErrors, {
      maxSize: [
        {
          fieldname: 'test[1]',
          originalname: 'originalname',
          size: 10 * 1024 * 1024 + 1,
          maxSize: 10 * 1024 * 1024,
          expires: undefined,
          allowed_types: undefined
        }
      ]
    }, 'adds an error object to the `maxSize` error collection')
  }

  t.end()
})
