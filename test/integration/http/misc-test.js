let { join } = require('path')
let { existsSync, mkdirSync } = require('fs')
let { sync: rm } = require('rimraf')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { checkHttpResult: checkResult, url, shutdown } = require('./_utils')

let mock = join(process.cwd(), 'test', 'mock')
let tmp = join(mock, 'tmp')

test('Set up env', t => {
  t.plan(2)
  rm(tmp)
  mkdirSync(tmp, { recursive: true })
  t.ok(sandbox, 'got sandbox')
  t.ok(existsSync(tmp), 'Created tmp dir')
})

test('[Misc] Start Sandbox', t => {
  t.plan(4)
  sandbox.start({ cwd: join(mock, 'normal'), quiet: true }, function (err, result) {
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
      t.match(err.body, new RegExp(message), `Errors with message instructing to add '${message}' handler`)
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

test('[Oversized response] get /chonky', t => {
  t.plan(2)
  tiny.get({
    url: url + '/chonky'
  }, function _got (err, result) {
    if (err) {
      let message = 'Invalid payload size'
      t.equal(err.statusCode, 502, 'Errors with 502')
      t.match(err.body, new RegExp(message), `Errors with message: '${message}'`)
    }
    else t.fail(result)
  })
})

test('[Service discovery] get /_asd', t => {
  t.plan(3)
  tiny.get({
    url: url + '/_asd'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      let services = result.body
      t.ok(services, 'Got back services object')
      t.ok(services.tables, 'Got back tables')
      t.equals(Object.keys(services.tables).length, 4, 'Got back all tables')
    }
  })
})

test('[Misc] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('[Env vars (.env)] Start Sandbox', t => {
  t.plan(4)
  sandbox.start({ cwd: join(mock, 'env', 'dot-env'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[Env vars (.env)] get /env', t => {
  t.plan(6)
  tiny.get({ url }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.equal(result.body.DOTENV_USERLAND_ENV_VAR, 'Why hello there from .env!', 'Received userland env var')
      t.ok(result.body.ARC_HTTP, 'Got ARC_HTTP env var')
      t.ok(result.body.ARC_STATIC_BUCKET, 'Got ARC_STATIC_BUCKET env var')
      t.ok(result.body.NODE_ENV, 'Got NODE_ENV env var')
      t.ok(result.body.SESSION_TABLE_NAME, 'Got SESSION_TABLE_NAME env var')
      // TODO add ARC_STATIC_SPA
      t.equal(result.body.TZ, 'UTC', 'Got TZ env var')
      delete process.env.DOTENV_USERLAND_ENV_VAR
    }
  })
})

test('[Env vars (.env)] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('[Env vars (preferences.arc)] Start Sandbox', t => {
  t.plan(4)
  sandbox.start({ cwd: join(mock, 'env', 'preferences'), }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[Env vars (preferences.arc)] get /env', t => {
  t.plan(6)
  tiny.get({ url }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.equal(result.body.PREFERENCES_DOT_ARC_USERLAND_ENV_VAR, 'Why hello there from preferences.arc!', 'Received userland env var')
      t.ok(result.body.ARC_HTTP, 'Got ARC_HTTP env var')
      t.ok(result.body.ARC_STATIC_BUCKET, 'Got ARC_STATIC_BUCKET env var')
      t.ok(result.body.NODE_ENV, 'Got NODE_ENV env var')
      t.ok(result.body.SESSION_TABLE_NAME, 'Got SESSION_TABLE_NAME env var')
      // TODO add ARC_STATIC_SPA
      t.equal(result.body.TZ, 'UTC', 'Got TZ env var')
      delete process.env.PREFERENCES_DOT_ARC_USERLAND_ENV_VAR
    }
  })
})

test('[Env vars (preferences.arc)] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('[Env vars (.arc-env)] Start Sandbox', t => {
  t.plan(4)
  sandbox.start({ cwd: join(mock, 'env', 'dot-arc-env'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[Env vars (.arc-env)] get /env', t => {
  t.plan(6)
  tiny.get({ url }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.equal(result.body.DOT_ARC_ENV_USERLAND_ENV_VAR, 'Why hello there from .arc-env!', 'Received userland env var')
      t.ok(result.body.ARC_HTTP, 'Got ARC_HTTP env var')
      t.ok(result.body.ARC_STATIC_BUCKET, 'Got ARC_STATIC_BUCKET env var')
      t.ok(result.body.NODE_ENV, 'Got NODE_ENV env var')
      t.ok(result.body.SESSION_TABLE_NAME, 'Got SESSION_TABLE_NAME env var')
      // TODO add ARC_STATIC_SPA
      t.equal(result.body.TZ, 'UTC', 'Got TZ env var')
      delete process.env.DOT_ARC_ENV_USERLAND_ENV_VAR
    }
  })
})

test('[Misc] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('[Multiple possible handlers] Start Sandbox', t => {
  t.plan(4)
  sandbox.start({ cwd: join(mock, 'multihandler'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[Multiple possible handlers] get /deno/index.js', t => {
  t.plan(6)
  let rawPath = '/deno/index.js'
  tiny.get({
    url: url + rawPath
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /deno/index.js'
      })
    }
  })
})

test('[Multiple possible handlers] get /deno/index.ts', t => {
  t.plan(6)
  let rawPath = '/deno/index.ts'
  tiny.get({
    url: url + rawPath
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /deno/index.ts'
      })
    }
  })
})

test('[Multiple possible handlers] get /deno/index.tsx', t => {
  t.plan(6)
  let rawPath = '/deno/index.tsx'
  tiny.get({
    url: url + rawPath
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /deno/index.tsx'
      })
    }
  })
})

test('[Multiple possible handlers] get /deno/mod.js', t => {
  t.plan(6)
  let rawPath = '/deno/mod.js'
  tiny.get({
    url: url + rawPath
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /deno/mod.js'
      })
    }
  })
})

test('[Multiple possible handlers] get /deno/mod.ts', t => {
  t.plan(6)
  let rawPath = '/deno/mod.ts'
  tiny.get({
    url: url + rawPath
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /deno/mod.ts'
      })
    }
  })
})

test('[Multiple possible handlers] get /deno/mod.tsx', t => {
  t.plan(6)
  let rawPath = '/deno/mod.tsx'
  tiny.get({
    url: url + rawPath
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /deno/mod.tsx'
      })
    }
  })
})

test('[Multiple possible handlers] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('Teardown', t => {
  t.plan(1)
  delete process.env.ARC_API_TYPE
  rm(tmp)
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
})
