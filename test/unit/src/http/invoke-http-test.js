let test = require('tape')
let sinon = require('sinon')
let proxyquire = require('proxyquire')
let lambdaStub = sinon.stub().yields()
let invoke = proxyquire('../../../../src/http/invoke-http', {
  '../invoke-lambda': lambdaStub
})

test('invoke-http should replace cookie header with ssl and path modifications when lambda returns arc5 style response', t => {
  t.plan(1)
  let handler = invoke({})
  lambdaStub.yields(null, {
    cookie: 'nomnom; Secure'
  })
  let res = {
    setHeader: sinon.fake.returns(),
    end: sinon.fake.returns()
  }
  let req = {
    url: 'http://localhost:3333',
    headers: {}
  }
  handler(req, res);
  t.ok(res.setHeader.calledWith('Set-Cookie', 'nomnom; Path=/'), 'setHeader called with modified cookie')
})

test('invoke-http should replace cookie header with ssl and path modifications when lambda returns arc6 style response', t => {
  t.plan(1)
  let handler = invoke({})
  lambdaStub.yields(null, {
    headers: {
      'Set-Cookie': 'nomnom; Secure'
    }
  })
  let res = {
    setHeader: sinon.fake.returns(),
    end: sinon.fake.returns()
  }
  let req = {
    url: 'http://localhost:3333',
    headers: {}
  }
  handler(req, res);
  t.ok(res.setHeader.calledWith('Set-Cookie', 'nomnom; Path=/'), 'setHeader called with modified cookie')
})
