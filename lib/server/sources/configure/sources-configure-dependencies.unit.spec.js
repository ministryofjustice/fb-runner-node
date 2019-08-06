const test = require('tape')
const {stub, spy} = require('sinon')
const proxyquire = require('proxyquire')

const path = require('path')
const pathJoinSpy = spy(path, 'join')
const pathResolve = path.resolve
const pathResolveStub = stub(path, 'resolve')
pathResolveStub.callsFake((arg1, arg2) => {
  // console.log({arg1, arg2})
  if (arg2 && arg2.includes('service_path')) {
    // console.log({arg2})
    return arg2
  }
  if (!arg2) {
    return arg1
  }
  return pathResolve(arg1, arg2)
})
const loadJsonFile = require('load-json-file')
const loadJsonFileSyncStub = stub(loadJsonFile, 'sync')
loadJsonFileSyncStub.callsFake(file => {
  const json = {
    foo: 'bar'
  }
  if (file.includes('isa')) {
    json._isa = 'has_isa'
  }
  return json
})

const configureDependencies = proxyquire('./sources-configure-dependencies', {
  path,
  'load-json-file': loadJsonFile
})

const resetStubs = () => {
  pathJoinSpy.resetHistory()
  pathResolveStub.resetHistory()
  loadJsonFileSyncStub.resetHistory()
}

test('When determining the sources for a form with a single dependency', t => {
  resetStubs()

  loadJsonFileSyncStub.callsFake(file => {
    const json = {
      dependencies: {}
    }
    if (file.includes('service_package_path')) {
      json.dependencies = {
        base_components: 'version'
      }
    }
    return json
  })

  const serviceSources = configureDependencies('service_package_path', 'service_node_modules_path')

  t.deepEqual(serviceSources, [{source: 'base_components', sourcePath: 'service_node_modules_path/base_components'}], 'it should return the dependency for the service')

  t.end()
})

test('When determining the sources for a form with nested dependencies', t => {
  resetStubs()

  loadJsonFileSyncStub.callsFake(file => {
    const json = {
      dependencies: {}
    }
    if (file.includes('service_package_path')) {
      json.dependencies = {
        base_components: 'version'
      }
    } else if (file.includes('base_components')) {
      json.dependencies = {
        nested_components: 'version'
      }
    }
    return json
  })

  const serviceSources = configureDependencies('service_package_path', 'service_node_modules_path')

  t.deepEqual(serviceSources, [{source: 'nested_components', sourcePath: 'service_node_modules_path/nested_components'}, {source: 'base_components', sourcePath: 'service_node_modules_path/base_components'}], 'it should return the dependencies for the service in the correct order')

  t.end()
})

test('When determining the sources for a form with multiple dependencies', t => {
  resetStubs()

  loadJsonFileSyncStub.callsFake(file => {
    const json = {
      dependencies: {}
    }
    if (file.includes('service_package_path')) {
      json.dependencies = {
        base_components: 'version',
        other_components: 'version'
      }
    }
    return json
  })

  const serviceSources = configureDependencies('service_package_path', 'service_node_modules_path')

  t.deepEqual(serviceSources, [{source: 'other_components', sourcePath: 'service_node_modules_path/other_components'}, {source: 'base_components', sourcePath: 'service_node_modules_path/base_components'}], 'it should return the dependencies for the service in the correct order')

  t.end()
})

test('When determining the sources for a form containing a dependency specified more than once', t => {
  resetStubs()

  loadJsonFileSyncStub.callsFake(file => {
    const json = {
      dependencies: {}
    }
    if (file.includes('service_package_path')) {
      json.dependencies = {
        base_components: 'version',
        other_components: 'version'
      }
    } else if (file.includes('base_components')) {
      json.dependencies = {
        nested_components_a: 'version'
      }
    } else if (file.includes('other_components')) {
      json.dependencies = {
        nested_components_a: 'version'
      }
    }
    return json
  })

  const serviceSources = configureDependencies('service_package_path', 'service_node_modules_path')

  t.deepEqual(serviceSources, [{source: 'nested_components_a', sourcePath: 'service_node_modules_path/nested_components_a'}, {source: 'other_components', sourcePath: 'service_node_modules_path/other_components'}, {source: 'base_components', sourcePath: 'service_node_modules_path/base_components'}], 'it should return the dependencies for the service in the correct order and with any duplicated sources filtered out')

  t.end()
})

test('When determining the sources for a form containing a dependency specified more than once with different versions', t => {
  resetStubs()

  loadJsonFileSyncStub.callsFake(file => {
    const json = {
      dependencies: {}
    }
    if (file.includes('service_package_path')) {
      json.dependencies = {
        base_components: 'version',
        other_components: 'version'
      }
    } else if (file.includes('base_components')) {
      json.dependencies = {
        nested_components_a: 'version'
      }
    } else if (file.includes('other_components')) {
      json.dependencies = {
        nested_components_a: 'other_version'
      }
    }
    return json
  })

  try {
    t.throws(configureDependencies('service_package_path', 'service_node_modules_path'))
  } catch (e) {
    t.equal(e.name, 'FBDependencyError', 'it should throw an error of the correct type')
    t.equal(e.message, 'Different versions of nested_components_a found: other_version / version', 'it should report the correct error message')
  }

  t.end()
})

test('When overriding the path for a dependency source', t => {
  resetStubs()

  loadJsonFileSyncStub.callsFake(file => {
    const json = {
      dependencies: {}
    }
    if (file.includes('service_package_path')) {
      json.dependencies = {
        '@scope/base-components': 'version',
        '@scope/other-components': 'version'
      }
    }
    return json
  })

  process.env.MODULE__scope_base_components = 'overridden_path'
  const serviceSources = configureDependencies('service_package_path', 'service_node_modules_path')
  process.env.MODULE__scope_base_components = ''

  t.deepEqual(serviceSources, [{source: '@scope/other-components', sourcePath: 'service_node_modules_path/@scope/other-components'}, {source: '@scope/base-components', sourcePath: 'overridden_path'}], 'it should return the dependencies for the service with the dependency path overridden')

  t.end()
})
