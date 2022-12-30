const test = require('tape')

const setMultipartForm = require('./set-multipart-form')

const getContentTypeStub = (type) => {
  return () => type
}

test('The pageInstance has upload controls', async t => {
  const pageInstance = await setMultipartForm({
    _id: 'page.test',
    _type: 'page.form',
    components: [{
      _type: 'upload'
    }]
  }, { req: {} })

  t.equal(pageInstance.encType, true, 'it should set page’s encType to true')

  t.end()
})

test('The pageInstance does not have upload controls', async t => {
  const pageInstance = await setMultipartForm({
    _id: 'page.test',
    _type: 'page.form',
    components: [{
      _type: 'text'
    }]
  }, { req: {} })

  t.equal(pageInstance.encType, undefined, 'it should not set page’s encType to true')

  t.end()
})

test('The method is POST and the content-type is multipart/form-data', async t => {
  await setMultipartForm({
    _id: 'page.test',
    _type: 'page.form',
    components: [{
      _type: 'upload'
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

test('The method is POST and the content-type is not multipart/form-data', async t => {
  try {
    t.throws(await setMultipartForm({
      _id: 'page.test',
      _type: 'page.form',
      components: [{
        _type: 'upload'
      }]
    }, {
      req: {
        method: 'POST',
        get: getContentTypeStub('application/x-www-form-urlencoded')
      }
    }))
  } catch (e) {
    t.equal(e.message, '400', 'it should throw a bad request')
  }

  t.end()
})

test('The method is POST and the content-type is application/x-www-form-urlencoded', async t => {
  await setMultipartForm({
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

test('The method is POST and the content-type is not multipart/form-data', async t => {
  try {
    t.throws(await setMultipartForm({
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
    t.equal(e.message, '400', 'it should throw a bad request')
  }

  t.end()
})

test('The method is POST and there is no content-type', async t => {
  try {
    t.throws(await setMultipartForm({
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
    t.equal(e.message, '400', 'it should throw a bad request')
  }

  t.end()
})
