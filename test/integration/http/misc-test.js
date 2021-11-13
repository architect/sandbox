let { join } = require('path')
let { existsSync, mkdirSync } = require('fs')
let { sync: rm } = require('rimraf')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { checkHttpResult: checkResult, run, startup, shutdown, url } = require('../../utils')

let mock = join(process.cwd(), 'test', 'mock')
let tmp = join(mock, 'tmp')

test('Set up env', t => {
  t.plan(2)
  rm(tmp)
  mkdirSync(tmp, { recursive: true })
  t.ok(sandbox, 'Got Sandbox')
  t.ok(existsSync(tmp), 'Created tmp dir')
})

test('Run misc HTTP tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  t.test(`[Misc / ${runType}] Start Sandbox`, t => {
    startup[runType](t, 'normal')
  })

  t.test(`[Catchall / ${runType}] get /path - calls without trailing /* should fall through (and in this case fail)`, t => {
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

  t.test(`[Catchall / ${runType}] get /get-c (matches at root of catchall with trailing slash)`, t => {
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

  t.test(`[Catchall / ${runType}] get /get-c (matches with one child path part)`, t => {
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

  t.test(`[Catchall / ${runType}] get /get-c (matches with one child path part, trailing slash)`, t => {
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

  t.test(`[Catchall / ${runType}] get /get-c (matches with multiple child path parts)`, t => {
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

  t.test(`[Timeout / ${runType}] get /times-out`, t => {
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

  t.test(`[Oversized response / ${runType}] get /chonky`, t => {
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

  t.test(`[Misc / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  t.test(`[Env vars (.env) / ${runType}] Start Sandbox`, t => {
    process.env.__TESTING_ENV_VAR__ = 'henlo'
    startup[runType](t, join('env', 'dot-env'))
  })

  t.test(`[Env vars (.env)] get /env`, t => {
    t.plan(7)
    tiny.get({ url }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        t.equal(result.body.DOTENV_USERLAND_ENV_VAR, 'Why hello there from .env!', 'Received userland env var')
        t.ok(result.body.ARC_ENV, 'Got ARC_ENV env var')
        t.ok(result.body.ARC_STATIC_BUCKET, 'Got ARC_STATIC_BUCKET env var')
        t.ok(result.body.NODE_ENV, 'Got NODE_ENV env var')
        t.ok(result.body.SESSION_TABLE_NAME, 'Got SESSION_TABLE_NAME env var')
        t.equal(result.body.TZ, 'UTC', 'Got TZ env var')
        t.notOk(result.body.__TESTING_ENV_VAR__, 'No system env var pollution')
      }
    })
  })

  t.test(`[Env vars (.env) / ${runType}] Shut down Sandbox`, t => {
    delete process.env.__TESTING_ENV_VAR__
    shutdown[runType](t)
  })

  if (runType === 'module') {
    t.test(`[Env vars (env option) / ${runType}] Start Sandbox`, t => {
      process.env.__TESTING_ENV_VAR__ = 'henlo'
      startup[runType](t, join('env', 'dot-env'), {
        env: {
          dotenv_userland_env_var: 'Why hello there from overwritten .env!',
          ENV_OPTION_USERLAND_ENV_VAR: 'Why hello there from env option!',
        }
      })
    })

    t.test(`[Env vars (env option) / ${runType}] get /env`, t => {
      t.plan(8)
      tiny.get({ url }, function _got (err, result) {
        if (err) t.fail(err)
        else {
          t.equal(result.body.dotenv_userland_env_var, 'Why hello there from overwritten .env!', 'Received userland env var')
          t.equal(result.body.ENV_OPTION_USERLAND_ENV_VAR, 'Why hello there from env option!', 'Received userland env var')
          t.ok(result.body.ARC_ENV, 'Got ARC_ENV env var')
          t.ok(result.body.ARC_STATIC_BUCKET, 'Got ARC_STATIC_BUCKET env var')
          t.ok(result.body.NODE_ENV, 'Got NODE_ENV env var')
          t.ok(result.body.SESSION_TABLE_NAME, 'Got SESSION_TABLE_NAME env var')
          t.equal(result.body.TZ, 'UTC', 'Got TZ env var')
          t.notOk(result.body.__TESTING_ENV_VAR__, 'No system env var pollution')
        }
      })
    })

    t.test(`[Env vars (env option) / ${runType}] Shut down Sandbox`, t => {
      delete process.env.__TESTING_ENV_VAR__
      shutdown[runType](t)
    })

    t.test(`[Env vars (env option) remove / ${runType}] Start Sandbox`, t => {
      process.env.__TESTING_ENV_VAR__ = 'henlo'
      startup[runType](t, join('env', 'dot-env'), {
        env: {
          DOTENV_USERLAND_ENV_VAR: undefined,
          ENV_OPTION_USERLAND_ENV_VAR: 'Why hello there from env option!',
          ARC_ENV: undefined,
          ARC_STATIC_BUCKET: undefined,
          NODE_ENV: undefined,
          SESSION_TABLE_NAME: undefined,
          TZ: undefined
        }
      })
    })

    t.test(`[Env vars (env option) remove / ${runType}] get /env`, t => {
      t.plan(8)
      tiny.get({ url }, function _got (err, result) {
        if (err) t.fail(err)
        else {
          t.notOk(result.body.DOTENV_USERLAND_ENV_VAR, 'Removed userland env var')
          t.equal(result.body.ENV_OPTION_USERLAND_ENV_VAR, 'Why hello there from env option!', 'Received userland env var')
          t.ok(result.body.ARC_ENV, 'Got ARC_ENV env var')
          t.ok(result.body.ARC_STATIC_BUCKET, 'Got ARC_STATIC_BUCKET env var')
          t.ok(result.body.NODE_ENV, 'Got NODE_ENV env var')
          t.ok(result.body.SESSION_TABLE_NAME, 'Got SESSION_TABLE_NAME env var')
          t.equal(result.body.TZ, 'UTC', 'Got TZ env var')
          t.notOk(result.body.__TESTING_ENV_VAR__, 'No system env var pollution')
        }
      })
    })

    t.test(`[Env vars (env option) remove / ${runType}] Shut down Sandbox`, t => {
      delete process.env.__TESTING_ENV_VAR__
      shutdown[runType](t)
    })
  }

  t.test(`[Env vars (preferences.arc) / ${runType}] Start Sandbox`, t => {
    process.env.__TESTING_ENV_VAR__ = 'henlo'
    startup[runType](t, join('env', 'preferences'))
  })

  t.test(`[Env vars (preferences.arc) / ${runType}] get /env`, t => {
    t.plan(7)
    tiny.get({ url }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        t.equal(result.body.PREFERENCES_DOT_ARC_USERLAND_ENV_VAR, 'Why hello there from preferences.arc!', 'Received userland env var')
        t.ok(result.body.ARC_ENV, 'Got ARC_ENV env var')
        t.ok(result.body.ARC_STATIC_BUCKET, 'Got ARC_STATIC_BUCKET env var')
        t.ok(result.body.NODE_ENV, 'Got NODE_ENV env var')
        t.ok(result.body.SESSION_TABLE_NAME, 'Got SESSION_TABLE_NAME env var')
        t.equal(result.body.TZ, 'UTC', 'Got TZ env var')
        t.notOk(result.body.__TESTING_ENV_VAR__, 'No system env var pollution')
      }
    })
  })

  t.test(`[Env vars (preferences.arc) / ${runType}] Shut down Sandbox`, t => {
    delete process.env.__TESTING_ENV_VAR__
    shutdown[runType](t)
  })

  t.test(`[Env vars (.arc-env) / ${runType}] Start Sandbox`, t => {
    process.env.__TESTING_ENV_VAR__ = 'henlo'
    startup[runType](t, join('env', 'dot-arc-env'))
  })

  t.test(`[Env vars (.arc-env) / ${runType}] get /env`, t => {
    t.plan(7)
    tiny.get({ url }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        t.equal(result.body.DOT_ARC_ENV_USERLAND_ENV_VAR, 'Why hello there from .arc-env!', 'Received userland env var')
        t.ok(result.body.ARC_ENV, 'Got ARC_ENV env var')
        t.ok(result.body.ARC_STATIC_BUCKET, 'Got ARC_STATIC_BUCKET env var')
        t.ok(result.body.NODE_ENV, 'Got NODE_ENV env var')
        t.ok(result.body.SESSION_TABLE_NAME, 'Got SESSION_TABLE_NAME env var')
        t.equal(result.body.TZ, 'UTC', 'Got TZ env var')
        t.notOk(result.body.__TESTING_ENV_VAR__, 'No system env var pollution')
      }
    })
  })

  t.test(`[Misc / ${runType}] Shut down Sandbox`, t => {
    delete process.env.__TESTING_ENV_VAR__
    shutdown[runType](t)
  })

  t.test(`[Multiple possible handlers / ${runType}] Start Sandbox`, t => {
    startup[runType](t, 'multihandler')
  })

  t.test(`[Multiple possible handlers / ${runType}] get /deno/index.js`, t => {
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

  t.test(`[Multiple possible handlers / ${runType}] get /deno/index.ts`, t => {
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

  t.test(`[Multiple possible handlers / ${runType}] get /deno/index.tsx`, t => {
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

  t.test(`[Multiple possible handlers / ${runType}] get /deno/mod.js`, t => {
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

  t.test(`[Multiple possible handlers / ${runType}] get /deno/mod.ts`, t => {
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

  t.test(`[Multiple possible handlers / ${runType}] get /deno/mod.tsx`, t => {
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

  t.test(`[Misc / ${runType}] Shut down Sandbox`, t => {
    rm(tmp)
    shutdown[runType](t)
  })
}
