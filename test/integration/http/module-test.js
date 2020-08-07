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
test('Sync http.start', t => {
  t.plan(3)
  process.chdir(path.join(__dirname, '..', '..', 'mock', 'normal'))
  http.start({}, function () {
    t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
    t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
    t.pass('@http mounted')
  })
})

test('get /', t => {
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

test('Sync http.end', t => {
  t.plan(1)
  http.end(() => {
    tiny.get({ url }, err => {
      if (err) verifyShutdown(t, err)
      else t.fail('http did not shut down')
    })
  })
})

test('Async http.start', async t => {
  t.plan(3)
  process.chdir(path.join(__dirname, '..', '..', 'mock', 'normal'))

  try {
    await http.start({})
    t.pass('http started (async)')
    t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
    t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
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
        t.ok(data.body.message.includes('Hello from get / running the default runtime'), 'is hello world')
        console.log({ data })
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
