const test = require('tap').test

const {
  initControllers,
  getControllers,
  getController,
  getInstanceController
} = require('./controller')

const emptyControllers = JSON.parse(JSON.stringify(getControllers()))
initControllers([])

const expectedControllers = {
  page: {
    instance: {
      'return.setup.email.check': {}
    },
    type: {
      'page.summary': {},
      'page.confirmation': {}
    }
  },
  component: {
    instance: {},
    type: {
      date: {}
    }
  }
}

test('When the module has not been initialised', function (t) {
  t.deepEqual(emptyControllers, {
    page: {
      instance: {},
      type: {}
    },
    component: {
      instance: {},
      type: {}
    }
  }, 'it should have registered no controllers')
  t.end()
})

test('When the module has been initialised', function (t) {
  const controllers = JSON.parse(JSON.stringify(getControllers()))
  t.deepEqual(controllers, expectedControllers, 'it should have registered the expected controllers')
  t.end()
})

test('When requesting controllers by schema type', function (t) {
  const controllers = JSON.parse(JSON.stringify(getControllers('page')))
  t.deepEqual(controllers, expectedControllers.page, 'it should return the expected controllers')
  const noControllers = getControllers('foo')
  t.deepEqual(noControllers, {}, 'it should return no controllers if the schema type requested does not exist')
  t.end()
})

test('When requesting controllers by instance type', function (t) {
  const controllers = JSON.parse(JSON.stringify(getControllers('page', 'type')))
  t.deepEqual(controllers, expectedControllers.page.type, 'it should return the expected controllers')
  const noControllers = getControllers('page', 'foo')
  t.deepEqual(noControllers, {}, 'it should return no controllers if the instance type requested does not exist')
  t.end()
})

test('When requesting a controller by key', function (t) {
  const controller = getController('page', 'type', 'page.summary')
  t.equal(typeof controller.setContents, 'function', 'it should return the controller if it exists')
  const noController = getController('page', 'type', 'page.foo')
  t.deepEqual(Object.keys(noController), [], 'it should an empty object if no controller exists for the key')
  const noSchemaTypeController = getController('component', 'type', 'page.foo')
  t.deepEqual(Object.keys(noSchemaTypeController), [], 'it should an empty object if no controllers exist for the type')
  t.end()
})

test('When requesting an instance controller', function (t) {
  const controller = getInstanceController({
    _id: 'page.foo',
    _type: 'page.summary'
  })
  t.equal(typeof controller.setContents, 'function', 'it should return the controller if it exists')
  // const noController = getController('page', 'type', 'page.foo')
  // t.deepEqual(Object.keys(noController), [], 'it should an empty object if no controller exists')
  t.end()
})
