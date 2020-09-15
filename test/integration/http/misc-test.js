let path = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sandbox = require('../../../src')
let { url, shutdown } = require('./_utils')

let cwd = process.cwd()

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'got sandbox')
})

test('[Misc] Start Sandbox', t => {
  t.plan(4)
  process.chdir(path.join(__dirname, '..', '..', 'mock', 'normal'))
  sandbox.start({}, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[Env vars] get /env', t => {
  t.plan(5)
  tiny.get({
    url: url + '/env'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.equal(result.body.USERLAND_ENV_VAR, 'Why hello there!', 'Received userland env var')
      t.ok(result.body.ARC_HTTP, 'Got ARC_HTTP env var')
      t.ok(result.body.ARC_STATIC_BUCKET, 'Got ARC_STATIC_BUCKET env var')
      t.ok(result.body.NODE_ENV, 'Got NODE_ENV env var')
      t.ok(result.body.SESSION_TABLE_NAME, 'Got SESSION_TABLE_NAME env var')
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
      t.ok(err.body.includes(message), `Errors with message: '${message}'`)
      t.ok(err.body.includes(time), `Timed out set to ${time}`)
    }
    else t.fail(result)
  })
})

test('[Misc] Teardown', t => {
  t.plan(3)
  shutdown(t)
  delete process.env.ARC_API_TYPE
  process.chdir(cwd)
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
