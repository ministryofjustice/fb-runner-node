const test = require('tap').test

const path = require('path')
const jp = require('jsonpath')

const {deepClone} = require('@ministryofjustice/fb-utils-node')

const {propagate} = require('./propagate-steps')

const getTestData = name => {
  const dataPath = path.resolve('data', 'steps', `${name}.json`)
  return require(dataPath)
}

const getNestedInstance = (instances, id) => {
  return jp.query(instances, `$..[?(@._id === "${id}")]`)[0]
}

test('When adding _parent properties to step instances', async t => {
  const input = getTestData('input-a')
  const instances = propagate(input)

  const withParents = Object.keys(instances).filter(key => instances[key]._parent)
  t.equal(withParents.length, 7, 'it should add the _parent ref to the correct number of instances')
  const parentValues = instances.stepA._parent === 'topA' &&
    instances.stepB._parent === 'topA' &&
    instances.stepC._parent === 'stepA' &&
    instances.stepZ._parent === 'topB'
  t.ok(parentValues, 'it should set the correct _parent values')

  t.equal(instances.topA.namePrefix, 'namespaceA')
  t.deepEqual(instances.topA.$namespaces, ['namespaceA'])
  t.equal(instances.topA.url, '/top-a')
  t.equal(instances.stepA.namePrefix, 'namespaceA')
  t.deepEqual(instances.stepA.$namespaces, ['namespaceA'])
  t.equal(instances.stepA.url, '/top-a/step-a')
  t.equal(instances.stepC.namePrefix, 'namespaceA.namespaceC[{namespaceC}]')
  t.deepEqual(instances.stepC.$namespaces, ['namespaceA', 'namespaceC'])
  t.equal(instances.stepC.url, '/top-a/step-a/step-c/:namespaceC')
  t.equal(instances.stepB.namePrefix, undefined)
  t.equal(instances.stepB.url, '/step-b')
  t.equal(instances.topB.namePrefix, undefined)
  t.deepEqual(instances.topB.$namespaces, undefined)
  t.equal(instances.topB.url, '/topB')
  t.equal(instances.stepZ.namePrefix, 'namespaceZ')
  t.deepEqual(instances.stepZ.$namespaces, ['namespaceZ'])
  t.equal(instances.stepZ.url, '/topB/step-z')
  t.equal(instances.topD.url, '/topD', 'it should use the page id if url is missing')
  t.equal(instances.topE.url, '/top-e/:namespaceE')
  t.equal(instances.topE.namePrefix, 'namespaceE[{namespaceE}]')
  t.deepEqual(instances.topE.$namespaces, ['namespaceE'])
  t.equal(instances.stepF.url, '/top-e/:namespaceE/step-f')
  t.equal(instances.stepF.namePrefix, 'namespaceE[{namespaceE}].namespaceF')
  t.deepEqual(instances.stepF.$namespaces, ['namespaceE', 'namespaceF'])

  t.equal(instances.mountedG.url, '/top-a/mount-g')
  t.equal(instances.mountedG.namePrefix, 'namespaceA')
  t.deepEqual(instances.mountedG.$namespaces, ['namespaceA'])
  t.equal(instances.root.url, '/')
  t.equal(instances.mountOnRoot.url, '/mount-on-root')

  t.equal(instances.scopeA.scope, 'another-scope')
  t.equal(instances.scopeB.scope, 'another-scope')
  t.equal(instances.scopeC.scope, 'own-scope')
  t.equal(instances.mountedContextD.scope, 'another-scope')
})

test('When a step is referenced by multiple parent pages', async t => {
  const badData = getTestData('input-duplicate-step-ref')
  const error = t.throws(() => propagate(badData), 'should throw an error')

  t.equal(error.name, 'FBPageParentError', 'it should return a FBPageParentError')
  t.equal(error.data.step, 'stepA', 'it should return the duplicated step')
  const eInstances = error.data.instances
  t.notDeepEqual(eInstances.stepA, badData.stepA, 'it should have altered the duplicated step')
  delete eInstances.stepA
  const badDataClone = deepClone(badData)
  delete badDataClone.stepA
  t.deepEqual(eInstances, badDataClone, 'it should not have altered the parent pages')
})

test('When processing step instances for section headings', async t => {
  const input = getTestData('input-step-heading')
  const instances = propagate(input)

  t.equal(getNestedInstance(instances, 'stepA').sectionHeading, 'Top A section heading', 'it should copy step headings to step sectionHeading property')
  t.equal(getNestedInstance(instances, 'stepC').sectionHeading, 'Top A section heading', 'it should copy step headings recursively')
  t.equal(getNestedInstance(instances, 'stepB').sectionHeading, 'Step B section heading', 'it should not copy step headings to steps that have a sectionHeading property')
  t.equal(getNestedInstance(instances, 'stepE').sectionHeading, 'Step B section heading', 'it should copy step headings recursively even if not at root level')
  t.equal(getNestedInstance(instances, 'stepD').sectionHeading, '', 'it should not copy step headings to steps that have an explicitly empty sectionHeading property')
  t.equal(getNestedInstance(instances, 'stepF').sectionHeading, 'Step F section heading', 'it should not copy section headings to steps that have a sectionHeading property')
})

test('When propagating a repeatable instance without a namespace', async t => {
  const input = {
    repeatableA: {
      _id: 'repeatableA',
      _type: 'page.form',
      repeatable: true
    }
  }

  const expectedErrorData = {
    _id: 'repeatableA',
    instances: {
      repeatableA: {
        _id: 'repeatableA',
        _type: 'page.form',
        repeatable: true,
        url: '/repeatableA',
        $FALLBACKurl: true
      }
    }
  }

  const error = t.throws(() => propagate(input), 'should throw an error')
  t.equal(error.name, 'FBPageRepeatableNamespaceError', 'it should throw an error')
  t.equal(error.message, 'repeatableA is repeatable but has no namespace', 'it should report the id of the page without the namespace as the error message')
  t.deepEqual(error.data, expectedErrorData, 'it should return the instances processed so far as the data property of the error object')
})

test('When a single step is missing', async t => {
  const badData = getTestData('input-single-missing-step')

  const error = t.throws(() => propagate(badData), 'should throw an error')

  t.equal(error.name, 'FBPageMissingError', 'it should return a FBPageMissingError')
  t.equal(error.data.step, 'stepA', 'it should return the missing step')
})

test('When there are both present and missing steps', async t => {
  const badData = getTestData('input-present-and-missing-steps')

  const error = t.throws(() => propagate(badData), 'should throw an error')

  t.equal(error.name, 'FBPageMissingError', 'it should return a FBPageMissingError')
  t.equal(error.data.step, 'stepX', 'it should return the missing step')
})
