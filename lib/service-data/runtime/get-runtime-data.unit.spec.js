const {
  test
} = require('tap')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const debugStub = sinon.stub()
const logStub = sinon.stub()
const errorStub = sinon.stub()

debugStub.onCall(0).returns(logStub)
debugStub.onCall(1).returns(errorStub)

const mockMergedInstances = {}
const mockPropagateStepsInstances = {}
const mockPropagateShowInstances = {}
const mockCategoryInstances = {}
const mockRepeatableInstances = {}
const mockInstances = {}

const mergeInstancesMergeStub = sinon.stub().returns(mockMergedInstances)
const propagateCategoriesPropagateStub = sinon.stub().returns(mockCategoryInstances)
const propagateStepsPropagateStub = sinon.stub().returns(mockPropagateStepsInstances)
const propagateShowPropagateStub = sinon.stub().returns(mockPropagateShowInstances)
const injectRepeatablePagesInjectSub = sinon.stub().returns(mockRepeatableInstances)
const internationalizeRoutesi18nUrlsStub = sinon.stub().returns(mockInstances)

const {
  getRuntimeData
} = proxyquire('./get-runtime-data', {
  debug: debugStub,
  './merge-instances': { merge: mergeInstancesMergeStub },
  './propagate-categories': { propagate: propagateCategoriesPropagateStub },
  './propagate-steps': { propagate: propagateStepsPropagateStub },
  './propagate-show': { propagate: propagateShowPropagateStub },
  './inject-repeatable-pages': { inject: injectRepeatablePagesInjectSub },
  './internationalize-routes': { i18nUrls: internationalizeRoutesi18nUrlsStub }
})

const source = {
  source: 'source1',
  path: path.resolve('data/runtime/metadata')
}

test('Transforming the edit-time instances into run-time instances', async (t) => {
  const sources = [source]
  const schemas = require(path.resolve('data/categories/schemas'))
  /*
   *  This is a JS object, not JSON
   */
  const expected = require(path.resolve('data/runtime/expected'))
  const runtimeData = await getRuntimeData(sources, schemas)

  const {
    sourceInstances: {
      data
    }
  } = runtimeData

  t.ok(data, 'assigns the source instances to the `sourceInstances` field')

  t.ok(mergeInstancesMergeStub.calledWith(sinon.match.array), 'calls merge')
  t.ok(propagateStepsPropagateStub.calledWith(mockMergedInstances), 'calls propagate (2)')
  t.ok(propagateCategoriesPropagateStub.calledWith(mockPropagateStepsInstances, schemas), 'calls propagate (1)')
  t.ok(propagateShowPropagateStub.calledWith(mockCategoryInstances), 'calls propagate (3)')
  t.ok(injectRepeatablePagesInjectSub.calledWith(mockPropagateShowInstances), 'calls inject')
  t.ok(internationalizeRoutesi18nUrlsStub.calledWith(mockRepeatableInstances), 'calls i18nUrls')

  t.same(runtimeData, expected, 'transforms the source instances')

  t.end()
})
