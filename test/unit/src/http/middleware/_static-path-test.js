let test = require('tape')
let fs = require('fs')
let { join } = require('path')
let sinon = require('sinon')
let proxyquire = require('proxyquire')
let sendStub = sinon.stub().returns({
  on: sinon.stub().returnsThis(),
  pipe: sinon.stub().returns(true)
})
let mock = join(process.cwd(), 'test', 'mock', 'normal')
let staticPath = join(mock, 'public')

// Assigned in test
let existsStub
let pub

test('Set up env', t => {
  // Set up stubs here or during initialization this test interferes with other' fs readFileSync calls lol
  existsStub = sinon.stub(fs, 'existsSync').returns(true)
  pub = proxyquire('../../../../../src/http/middleware/_static-path', {
    'send': sendStub
  })
  t.end()
})

test('_static should invoke next() if url does not start with _static', t => {
  t.plan(1)
  let fake = sinon.fake()
  pub({ staticPath }, { url: '/api/signup' }, null, fake)
  t.ok(fake.calledOnce, 'next() invoked')
})

test('_static should invoke next() if url starts with _static but does not exist', t => {
  t.plan(1)
  existsStub.returns(false)
  let fake = sinon.fake()
  pub({ staticPath }, { url: '/_static/my.css' }, null, fake)
  t.ok(fake.calledOnce, 'next() invoked')
})
test('_static should invoke send() with file location if url starts with _static and exists', t => {
  t.plan(2)
  existsStub.returns(true)
  existsStub.resetHistory()
  let statStub = sinon.stub(fs, 'statSync').returns({ isFile: sinon.fake.returns(true) })
  let req = { url: '/_static/my.css' }
  let correct = join(mock, 'public', 'my.css')
  pub({ staticPath }, req, null, sinon.fake())
  t.equals(existsStub.lastCall.args[0], correct, 'correct file checked for existence')
  t.equals(statStub.lastCall.args[0], correct, 'correct file stated')
  existsStub.restore()
  statStub.restore()
})

test('_static test teardown', t => {
  sinon.restore()
  t.end()
})
