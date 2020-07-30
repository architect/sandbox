let path = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let { http } = require('../../../src')
let { url, verifyShutdown } = require('./_utils')
let cwd = process.cwd()

test('Set up env', t => {
  t.plan(1)
  t.ok(http, 'HTTP module is present')
})

/**
 * Test sandbox.http as a module in isolation
 * - This used to be in the other tests, back when everything was kinda smooshed together
 * - Now with multiple API paths, we'll test this (hopefully) free of side effects
 */
test('http.start', t => {
  t.plan(3)
  process.chdir(path.join(__dirname, '..', '..', 'mock', 'normal'))
  http.start(function () {
    t.equal(process.env.ARC_API_TYPE, 'rest', 'API type set to REST')
    t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
    t.pass('@http mounted')
  })
})

test('[sandbox.http isolated] get /', t => {
  t.plan(2)
  tiny.get({ url },
    function _got (err, data) {
      if (err) t.fail(err)
      else {
        t.ok(data, 'got /')
        t.ok(data.body.message.includes('Hello from get / running the default runtime'), 'is hello world')
        console.log({ data })
      }
    })
})

test('http.close', t => {
  t.plan(1)
  http.close(() => {
    tiny.get({ url }, err => {
      if (err) verifyShutdown(t, err)
      else t.fail('http did not shut down')
    })
  })
})

test('Teardown', t => {
  t.plan(4)
  tiny.get({ url }, err => {
    if (err) verifyShutdown(t, err)
    else t.fail('Sandbox did not shut down')
  })
  delete process.env.ARC_API_TYPE
  delete process.env.DEPRECATED
  process.chdir(cwd)
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
  t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
