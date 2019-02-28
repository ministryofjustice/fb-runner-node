const test = require('tape')

const setMultipartForm = require('./set-multipart-form')

test('When setMultipartForm is passed a page containing no upload controls', async t => {
  const pageInstance = await setMultipartForm({
    _id: 'page.test',
    _type: 'page.form',
    components: [{
      _type: 'text'
    }]
  })

  t.equal(pageInstance.encType, undefined, 'it should not set page’s encType to true')
  t.equal(pageInstance.components[0].maxSize, undefined, 'it should not set component’s maxSize')

  t.end()
})

test('When setMultipartForm is passed a page containing upload controls', async t => {
  const pageInstance = await setMultipartForm({
    _id: 'page.test',
    _type: 'page.form',
    components: [{
      _type: 'fileupload'
    }]
  })

  t.equal(pageInstance.encType, true, 'it should set page’s encType to true')
  t.equal(pageInstance.components[0].maxSize, 10 * 1024 * 1024, 'it should not set component’s maxSize')

  t.end()
})
