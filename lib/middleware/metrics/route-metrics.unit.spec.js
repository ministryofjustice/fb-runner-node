const test = require('tape')
const proxyquire = require('proxyquire')
const {stub} = require('sinon')
const {getMocks} = require('../../spec/mock-express-middleware')

const promster = require('@promster/express')

const metricsRoute = proxyquire('./route-metrics', {
  '@promster/express': promster
})

test('When metrics endpoint is called', t => {
  const resSetHeaderStub = stub()
  const resEndStub = stub()
  const promsterGetContentTypeStub = stub(promster, 'getContentType')
  promsterGetContentTypeStub.callsFake(() => 'metrics-content-type')
  const promsterGetSummaryStub = stub(promster, 'getSummary')
  promsterGetSummaryStub.callsFake(() => 'metrics-summary')

  const {req} = getMocks({
    req: {
      headers: {}
    }
  })
  const res = {
    setHeader: resSetHeaderStub,
    end: resEndStub
  }

  metricsRoute(req, res)

  t.ok(resSetHeaderStub.calledOnce, 'it should call res.setContent once')
  t.ok(resEndStub.calledOnce, 'it should call res.end once')
  t.ok(promsterGetContentTypeStub.calledOnce, 'it should call promster.getContentType once')
  t.ok(promsterGetSummaryStub.calledOnce, 'it should call promster.getSummaryStub once')
  t.deepEqual(resSetHeaderStub.getCall(0).args, [
    'Content-Type', 'metrics-content-type'
  ], 'it should set the correct content-type')
  t.deepEqual(resEndStub.getCall(0).args, ['metrics-summary'], 'it should send the metrics output')

  promsterGetContentTypeStub.restore()
  promsterGetSummaryStub.restore()
  t.end()
})

test('When attempting to access the metrics endpoint from an external client', t => {
  const {req, res} = getMocks({
    req: {
      headers: {
        'x-forwarded-host': 'somewhere'
      }
    }
  })

  try {
    t.throws(metricsRoute(req, res))
  } catch (e) {
    t.equal(e.message, '403', 'it should throw 403 forbidden')
  }
  t.end()
})
