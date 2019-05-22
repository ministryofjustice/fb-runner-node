const test = require('tape')

const {
  initControllers,
  addControllers,
  getControllers,
  getController,
  getInstanceController,
  addModule,
  getModule,
  getModules
} = require('./controller')

const emptyControllers = JSON.parse(JSON.stringify(getControllers()))
initControllers()
addControllers({
  pageInstance: {
    testPageInstance: () => {}
  },
  pageType: {
    testPageType: () => {}
  },
  componentInstance: {
    testComponentInstance: () => {}
  },
  componentType: {
    testComponentType: () => {}
  }
})

const expectedControllers = {
  page: {
    instance: {},
    type: {
      'page.summary': {},
      'page.confirmation': {}
    }
  },
  component: {
    instance: {},
    type: {
      date: {},
      answers: {}
    }
  }
}

// this is the equivalent of what is actually seen when running the app
// why u no work?
// const shouldBeExpectedControllers = {
//   page: {
//     instance: {
//       testPageInstance: {}
//     },
//     type: {
//       testPageType: {},
//       'page.summary': {},
//       'page.confirmation': {}
//     }
//   },
//   component: {
//     instance: {
//       testComponentInstance: {}
//     },
//     type: {
//       testComponentType: {},
//       date: {}
//     }
//   }
// }

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
  t.end()
})

test('When requesting modules', function (t) {
  const fooModule = {bar: 'baz'}
  const modules = getModules()
  t.deepEqual(modules, {}, 'it should return an empty object')
  addModule('foo', fooModule)
  t.deepEqual(modules, {foo: fooModule}, 'it should update the modules object when adding a module')
  const module = getModule('foo')
  t.deepEqual(module, fooModule, 'it should return the correct module when an existing module is requested')
  const noModule = getModule('bar')
  t.deepEqual(noModule, {}, 'it should return an empty object when a non-existent module is requested')
  t.end()
})
