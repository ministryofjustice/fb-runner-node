const test = require('tape')

const processMojUploadedFiles = require('./process-moj-uploaded-files')

const mojFileUploadControl = [{
  _type: 'mojUpload',
  name: 'test',
  validation: {
    maxSize: 10 * 1024 * 1024
  }
}]

const mojUploadedFiles = {
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

test('when the `accept` property is not present', async t => {
  const {
    files
  } = await processMojUploadedFiles(mojUploadedFiles, mojFileUploadControl)

  t.deepEqual(files.allowed_types, undefined, '`allowed_types` is undefined')

  t.end()
})

test('when the `accept` property is an array', async t => {
  const mojFileUploadControlWithoutAccept = [{
    _type: 'mojUpload',
    name: 'test',
    maxSize: 10 * 1024 * 1024,
    validation: {
      accept: []
    }
  }]

  const {
    files
  } = await processMojUploadedFiles(mojUploadedFiles, mojFileUploadControlWithoutAccept)

  t.deepEqual(files.allowed_types, undefined, '`allowed_types` is undefined')

  t.end()
})

test('when the `accept` property is an array of mimetypes', async t => {
  const mojFileUploadControlWithAccept = [{
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
  } = await processMojUploadedFiles(mojUploadedFiles, mojFileUploadControlWithAccept)

  t.deepEqual(file.allowed_types, ['application/pdf', 'image/png'], '`allowed_types` is an array of mimetypes')

  t.end()
})

test('When an MOJ uploaded file is valid', async t => {
  const mojUploadedFilesWithoutFileErrors = {
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

  const mojUploadedFilesWithErrors = {
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
    } = await processMojUploadedFiles(mojUploadedFilesWithoutFileErrors, mojFileUploadControl)

    t.deepEqual(files, mojUploadedFilesWithoutFileErrors.files, 'returns the `files` property of the uploaded files object')
    t.deepEqual(fileErrors, {}, 'returns an object when the `fileErrors` property of the uploaded files object does not exist')
  }

  {
    const {
      files,
      fileErrors
    } = await processMojUploadedFiles(mojUploadedFilesWithErrors, mojFileUploadControl)

    t.deepEqual(files, mojUploadedFilesWithErrors.files, 'returns the `files` property of the uploaded files object')
    t.deepEqual(fileErrors, mojUploadedFilesWithErrors.fileErrors, 'returns the `fileErrors` property of the uploaded files object')
  }

  t.end()
})

test('When an MOJ uploaded file is not valid', async t => {
  const mojUploadedFiles = {
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
  } = await processMojUploadedFiles(mojUploadedFiles, mojFileUploadControl)

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

  t.end()
})
