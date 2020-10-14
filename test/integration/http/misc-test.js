let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { url, shutdown } = require('./_utils')

let cwd = process.cwd()
let mock = join(__dirname, '..', '..', 'mock')

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'got sandbox')
})

test('[Misc] Start Sandbox', t => {
  t.plan(4)
  process.chdir(join(mock, 'normal'))
  sandbox.start({ quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[Catchall] get /path - calls without trailing /* should fall through (and in this case fail)', t => {
  t.plan(2)
  let path = '/path'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) {
      let message = '@http get /path'
      t.equal(err.statusCode, 403, 'Errors with 403')
      t.ok(err.body.includes(message), `Errors with message instructing to add '${message}' handler`)
    }
    else t.fail(result)
  })
})

test('[Catchall] get /get-c (matches at root of catchall with trailing slash)', t => {
  t.plan(3)
  let path = '/get-c/'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      let { message, pathParameters, rawPath } = result.body
      t.equal(rawPath, path, `got ${rawPath}`)
      t.equal(pathParameters.proxy, '', 'Got correct proxy pathParameters')
      t.equal(message, 'Hello from get /get-c/*', 'Got correct handler response')
    }
  })
})

test('[Catchall] get /get-c (matches with one child path part)', t => {
  t.plan(3)
  let path = '/get-c/hi'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      let { message, pathParameters, rawPath } = result.body
      t.equal(rawPath, path, `got ${rawPath}`)
      t.equal(pathParameters.proxy, 'hi', 'Got correct proxy pathParameters')
      t.equal(message, 'Hello from get /get-c/*', 'Got correct handler response')
    }
  })
})

test('[Catchall] get /get-c (matches with one child path part, trailing slash)', t => {
  t.plan(3)
  let path = '/get-c/hi/'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      let { message, pathParameters, rawPath } = result.body
      t.equal(rawPath, path, `got ${rawPath}`)
      t.equal(pathParameters.proxy, 'hi/', 'Got correct proxy pathParameters')
      t.equal(message, 'Hello from get /get-c/*', 'Got correct handler response')
    }
  })
})

test('[Catchall] get /get-c (matches with multiple child path parts)', t => {
  t.plan(3)
  let path = '/get-c/hi/there/wonderful/person'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      let { message, pathParameters, rawPath } = result.body
      t.equal(rawPath, path, `got ${rawPath}`)
      t.equal(pathParameters.proxy, 'hi/there/wonderful/person', 'Got correct proxy pathParameters')
      t.equal(message, 'Hello from get /get-c/*', 'Got correct handler response')
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
