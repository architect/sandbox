let test = require('tape')
let fs = require('fs')
let path = require('path')
let sinon = require('sinon')
let proxyquire = require('proxyquire')
let sendStub = sinon.stub().returns({
  on: sinon.stub().returnsThis(),
  pipe: sinon.stub().returns(true)
})
let origEnv = process.env.ARC_SANDBOX_PATH_TO_STATIC
let origCwd = process.cwd()
let mock = path.join(__dirname, '..', '..', '..', 'mock', 'normal')

// Assigned in test
let existsStub
let pub

test('Set up env', t => {
  // Set up stubs here or during initialization this test interferes with other' fs readFileSync calls lol
  existsStub = sinon.stub(fs, 'existsSync').returns(true)
  pub = proxyquire('../../../../src/http/public-middleware', {
    'send': sendStub
  })
  t.end()
})

test('public-middleware test setup', t=>{
  t.plan(1)
  process.chdir(mock)
  process.env.ARC_SANDBOX_PATH_TO_STATIC = path.join(mock, 'public')
  t.equals(process.cwd(), mock)
})

test('public-middleware should invoke next() if url does not start with _static', t => {
  t.plan(1)
  let fake = sinon.fake()
  pub({url:'/api/signup'}, null, fake)
  t.ok(fake.calledOnce, 'next() invoked')
})

test('public-middleware should invoke next() if url starts with _static but does not exist', t => {
  t.plan(1)
  existsStub.returns(false)
  let fake = sinon.fake()
  pub({url:'/_static/my.css'}, null, fake)
  t.ok(fake.calledOnce, 'next() invoked')
})
test('public-middleware should invoke send() with file location if url starts with _static and exists', t => {
  t.plan(2)
  existsStub.returns(true)
  existsStub.resetHistory()
  let statStub = sinon.stub(fs, 'statSync').returns({ isFile: sinon.fake.returns(true) })
  let req = {url:'/_static/my.css'}
  let correct = path.join(mock, 'public', 'my.css')
  pub(req, null, sinon.fake())
  t.equals(existsStub.lastCall.args[0], correct, 'correct file checked for existence')
  t.equals(statStub.lastCall.args[0], correct, 'correct file stated')
  existsStub.restore()
  statStub.restore()
})

test('public-middleware test teardown', t=>{
  t.plan(1)
  process.chdir(origCwd)
  process.env.ARC_SANDBOX_PATH_TO_STATIC = origEnv
  sinon.restore()
  t.equals(process.cwd(), origCwd)
})
