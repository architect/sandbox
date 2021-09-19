let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let { http } = require(sut)
let { port, quiet, url, verifyShutdownNew } = require('./_utils')
let mock = join(process.cwd(), 'test', 'mock')
let name = 'HTTP module'

test('Set up env', t => {
  t.plan(1)
  t.ok(http, 'HTTP module is present')
})

/**
 * Test sandbox.http as a module in isolation
 * - This used to be in the other tests, back when everything was kinda smooshed together
 * - Now with multiple API paths, we'll test this (hopefully) free of side effects
 */
test('Sync http.start', t => {
  t.plan(1)
  http.start({ cwd: join(mock, 'normal'), port, quiet }, function (err, result) {
    if (err) t.fail(err)
    t.equal(result, 'HTTP successfully started', 'HTTP started')
  })
})

test('get /', t => {
  t.plan(2)
  tiny.get({ url },
    function _got (err, data) {
      if (err) t.fail(err)
      else {
        t.ok(data, 'got /')
        t.match(data.body.message, /Hello from get \/ running the default runtime/, 'is hello world')
      }
    })
})

test('Sync http.end', t => {
  t.plan(2)
  http.end((err, result) => {
    if (err) t.fail(err)
    t.equal(result, 'HTTP successfully shut down', 'HTTP ended')
    verifyShutdownNew(t, name)
  })
})

test('Async http.start', async t => {
  t.plan(1)
  try {
    let result = await http.start({ cwd: join(mock, 'normal'), port, quiet })
    t.equal(result, 'HTTP successfully started', 'Sandbox started')
  }
  catch (err) {
    t.fail(err)
  }
})

test('get /', t => {
  t.plan(2)
  tiny.get({ url },
    function _got (err, data) {
      if (err) t.fail(err)
      else {
        t.ok(data, 'got /')
        t.match(data.body.message, /Hello from get \/ running the default runtime/, 'is hello world')
      }
    })
})

test('Async http.end', async t => {
  t.plan(1)
  try {
    let ended = await http.end()
    t.equal(ended, 'HTTP successfully shut down', 'HTTP ended')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Teardown', t => {
  t.plan(1)
  verifyShutdownNew(t, name)
})
