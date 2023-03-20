let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { checkHttpResult: checkResult, run, startup, shutdown, url } = require('../utils')

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got Sandbox')
})

test('Run misc HTTP tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  t.test(`[Multiple possible handlers / ${runType}] Start Sandbox`, t => {
    startup[runType](t, 'multi-handler')
  })

  // Deno
  t.test(`[Multiple possible handlers / ${runType}] get /deno/index.js`, t => {
    t.plan(6)
    let rawPath = '/deno/index.js'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.end(err)
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
      if (err) t.end(err)
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
      if (err) t.end(err)
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
      if (err) t.end(err)
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
      if (err) t.end(err)
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
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /deno/mod.tsx'
        })
      }
    })
  })

  // Node.js
  t.test(`[Multiple possible handlers / ${runType}] get /node/esm/index.js`, t => {
    t.plan(6)
    let rawPath = '/node/esm/index.js'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /node/esm/index.js'
        })
      }
    })
  })

  t.test(`[Multiple possible handlers / ${runType}] get /node/esm/index.mjs`, t => {
    t.plan(6)
    let rawPath = '/node/esm/index.mjs'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /node/esm/index.mjs'
        })
      }
    })
  })

  t.test(`[Multiple possible handlers / ${runType}] get /node/cjs/index.cjs`, t => {
    t.plan(6)
    let rawPath = '/node/cjs/index.cjs'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /node/cjs/index.cjs'
        })
      }
    })
  })

  t.test(`[Multiple possible handlers / ${runType}] get /node/cjs/index.js`, t => {
    t.plan(6)
    let rawPath = '/node/cjs/index.js'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /node/cjs/index.js'
        })
      }
    })
  })

  t.test(`[Misc / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  t.test(`[Misc / ${runType}] Start Sandbox`, t => {
    startup[runType](t, 'multi-tenant')
  })

  t.test(`[Misc / ${runType}] Check multitenant Lambda on get /hello`, t => {
    t.plan(16)
    tiny.get({
      url: url + '/hello'
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from a multi-tenant Lambda!',
          routeKey: 'GET /hello',
          rawPath: '/hello',
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
          context: {
            awsRequestId: true, // Just check for presence
            functionName: 'sandbox-get-hello',
            functionVersion: '$LATEST',
            invokedFunctionArn: 'sandbox',
            memoryLimitInMB: 1152,
          }
        })
      }
    })
  })

  t.test(`[Misc / ${runType}] Check multitenant Lambda on get /hi`, t => {
    t.plan(16)
    tiny.get({
      url: url + '/hi'
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from a multi-tenant Lambda!',
          routeKey: 'GET /hi',
          rawPath: '/hi',
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
          context: {
            awsRequestId: true, // Just check for presence
            functionName: 'sandbox-get-hi',
            functionVersion: '$LATEST',
            invokedFunctionArn: 'sandbox',
            memoryLimitInMB: 1152,
          }
        })
      }
    })
  })

  t.test(`[Misc / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
