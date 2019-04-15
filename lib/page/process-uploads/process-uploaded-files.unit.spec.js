const test = require('tape')

const processUploadedFiles = require('./process-uploaded-files')

const uploadControls = [{
  _type: 'fileupload',
  name: 'test',
  maxSize: 10 * 1024 * 1024
}]

test('When processUploadedFiles is passed an upload that is valid', async t => {
  const processedResults = {
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

  const {files, fileErrors} = await processUploadedFiles(processedResults, uploadControls)
  t.deepEqual(files, processedResults.files, 'it should return the files object as is when no fileErrors already exists')
  t.equal(fileErrors, undefined, 'it should return no fileErrors object when no fileErrors already exists')

  const processedResultsWithErrors = {
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
      LIMIT_FILE_SIZE: [
        {
          fieldname: 'test[2]',
          originalname: 'originalname2'
        }
      ]
    }
  }

  const {files: filesB, fileErrors: fileErrorsB} = await processUploadedFiles(processedResultsWithErrors, uploadControls)
  t.deepEqual(filesB, processedResultsWithErrors.files, 'it should return the files object as is when fileErrors already exists')
  t.deepEqual(fileErrorsB, processedResultsWithErrors.fileErrors, 'it should the fileErrors object as is when it already exists')

  t.end()
})

test('When processUploadedFiles is passed an upload that is not valid', async t => {
  const processedResults = {
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

  const {files, fileErrors} = await processUploadedFiles(processedResults, uploadControls)
  t.deepEqual(files, {}, 'it should remove the invalid upload from the files object')
  t.deepEqual(fileErrors, {
    LIMIT_FILE_SIZE: [
      {
        fieldname: 'test[1]',
        originalname: 'originalname',
        maxSize: 10 * 1024 * 1024,
        size: 10 * 1024 * 1024 + 1
      }
    ]
  }, 'it should return one error')

  t.end()
})
