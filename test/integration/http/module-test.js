let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let { http } = require(sut)
let { url, verifyShutdown } = require('./_utils')
let cwd = process.cwd()
let mock = join(__dirname, '..', '..', 'mock')

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
  process.chdir(join(mock, 'normal'))
  http.start({ quiet: true }, function (err, result) {
    if (err) t.fail(err)
    t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
    t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
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

test('[Timeout] get /times-out', t => {
  t.plan(3)
  tiny.get({
    url: url + '/times-out'
  }, function _got (err, result) {
    if (err) {
      let message = 'Timeout Error'
      let time = '1 second'
      t.equal(err.statusCode, 500, 'Errors with 500')
      t.match(err.body, new RegExp(message), `Errors with message: '${message}'`)
      t.match(err.body, new RegExp(time), `Timed out set to ${time}`)
    }
    else t.fail(result)
  })
})

test('Sync http.end', t => {
  t.plan(1)
  http.end((err, result) => {
    if (err) t.fail(err)
    if (result !== 'HTTP successfully shut down') {
      t.fail('Did not get back HTTP shutdown message')
    }
    tiny.get({ url }, err => {
      if (err) verifyShutdown(t, err)
      else t.fail('http did not shut down')
    })
  })
})

test('Async http.start', async t => {
  t.plan(3)
  process.chdir(join(mock, 'normal'))
  try {
    let result = await http.start({ quiet: true })
    t.equal(result, 'HTTP successfully started', 'Sandbox started')
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
