const test = require('tape')

const setUploadControlsMaxSize = require('./set-moj-upload-controls-max-size')
const setMOJMultipartForm = require('./set-moj-multipart-form')

const getContentTypeStub = (type) => {
  return () => type
}

test('When setMOJMultipartForm is passed a page containing no upload controls', async t => {
  const pageInstance = await setMOJMultipartForm({
    _id: 'page.test',
    _type: 'page.form',
    components: [{
      _type: 'text'
    }]
  }, {req: {}})

  t.equal(pageInstance.encType, undefined, 'it should not set page’s encType to true')
  t.equal(pageInstance.components[0].maxSize, undefined, 'it should not set component’s maxSize')

  t.end()
})

test('When setMOJMultipartForm is passed a page containing upload controls', async t => {
  const pageInstance = await setMOJMultipartForm({
    _id: 'page.test',
    _type: 'page.form',
    components: [{
      _type: 'mojUpload'
    }]
  }, {req: {}})

  t.equal(pageInstance.encType, true, 'it should set page’s encType to true')
  t.equal(pageInstance.components[0].validation.maxSize, setUploadControlsMaxSize.defaultMaxSize, 'it should set component’s maxSize')

  t.end()
})

test('When the method in use is POST and the content-type should be multipart/form-data and it is', async t => {
  await setMOJMultipartForm({
    _id: 'page.test',
    _type: 'page.form',
    components: [{
      _type: 'mojUpload'
    }]
  }, {
    req: {
      method: 'POST',
      get: getContentTypeStub('multipart/form-data; boundary=foo')
    }
  })

  t.ok(true, 'it should let the request continue')

  t.end()
})

test('When the method in use is POST and the content-type should be multipart/form-data but is not', async t => {
  try {
    t.throws(await setMOJMultipartForm({
      _id: 'page.test',
      _type: 'page.form',
      components: [{
        _type: 'mojUpload'
      }]
    }, {
      req: {
        method: 'POST',
        get: getContentTypeStub('application/x-www-form-urlencoded')
      }
    }))
  } catch (e) {
    t.equals(e.message, '400', 'it should throw a bad request')
  }

  t.end()
})

test('When the method in use is POST and the content-type should be application/x-www-form-urlencoded and it is', async t => {
  await setMOJMultipartForm({
    _id: 'page.test',
    _type: 'page.form',
    components: [{
      _type: 'text'
    }]
  }, {
    req: {
      method: 'POST',
      get: getContentTypeStub('application/x-www-form-urlencoded')
    }
  })

  t.ok(true, 'it should let the request continue')

  t.end()
})

test('When the method in use is POST and the content-type should be multipart/form-data but is not', async t => {
  try {
    t.throws(await setMOJMultipartForm({
      _id: 'page.test',
      _type: 'page.form',
      components: [{
        _type: 'text'
      }]
    }, {
      req: {
        method: 'POST',
        get: getContentTypeStub('multipart/form-data; boundary=foo')

      }
    }))
  } catch (e) {
    t.equals(e.message, '400', 'it should throw a bad request')
  }

  t.end()
})

test('When the method in use is POST and there is no content-type', async t => {
  try {
    t.throws(await setMOJMultipartForm({
      _id: 'page.test',
      _type: 'page.form',
      components: [{
        _type: 'text'
      }]
    }, {
      req: {
        method: 'POST',
        get: getContentTypeStub()

      }
    }))
  } catch (e) {
    t.equals(e.message, '400', 'it should throw a bad request')
  }

  t.end()
})
