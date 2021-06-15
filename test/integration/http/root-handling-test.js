let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sandbox = require('../../../src')
let { url, shutdownAsync, checkHttpResult, checkRestResult } = require('./_utils')

let mock = join(process.cwd(), 'test', 'mock')
let indexHTML = 'Hello from public/index.html!'

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'got sandbox')
})

async function setup (t, type, dir) {
  process.env.ARC_API_TYPE = type
  let start = await sandbox.start({ cwd: join(mock, 'root-handling', dir), quiet: true })
  t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
  t.equal(process.env.ARC_API_TYPE, type, `API type set to ${type}`)
  t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
  t.equal(start, 'Sandbox successfully started', 'Sandbox started')
}
function teardown (t) {
  delete process.env.ARC_API_TYPE
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
}

/**
 * Root param with nested exact match: /:param/there
 */
test('[HTTP mode] get /hi/there - root param at /:param/there', async t => {
  t.plan(22)
  await setup(t, 'http', 'param-exact')

  let result
  result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  let rawPath = '/hi/there'
  result = await tiny.get({ url: url + rawPath })
  checkHttpResult(t, result.body, {
    message: 'Hello from get /:param/there running the default runtime',
    routeKey: 'GET /{param}/there',
    rawPath,
    pathParameters: { param: 'hi' },
    cookies: undefined,
    queryStringParameters: undefined,
    rawQueryString: '',
    headers: '🤷🏽‍♀️',
    isBase64Encoded: false,
    body: undefined,
  })

  await shutdownAsync(t)
  teardown(t)
})

test('[HTTP v1.0 (REST) mode] get /hi/there - root param at /:param/there', async t => {
  t.plan(23)
  await setup(t, 'httpv1', 'param-exact')

  let result
  result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  let path = '/hi/there'
  result = await tiny.get({ url: url + path })
  checkRestResult(t, result.body, {
    message: 'Hello from get /:param/there running the default runtime',
    resource: '/{param}/there',
    path,
    httpMethod: 'GET',
    headers: '🤷🏽‍♀️',
    multiValueHeaders: '🤷🏽‍♀️',
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: { param: 'hi' },
    body: null,
    isBase64Encoded: false,
  })

  await shutdownAsync(t)
  teardown(t)
})

// TODO fix this test, see: arc#982
// This shouldn't be possible, as /:param/whatever can't coexist with /{proxy+} ASAP in REST
/*
test('[REST mode] get /hi/there - root param at /:param/there', async t => {
  t.plan(8)
  await setup(t, 'rest', 'param-exact')

  try {
    await tiny.get({ url: url + '/hi/there' })
    t.fail(`Should not have gotten result`)
  }
  catch (err) {
    t.equal(err.statusCode, 403, 'Errors with 403')
  }

  await shutdownAsync(t)
  teardown(t)
})
*/

/**
 * Root param only: /:param
 */
test('[HTTP mode] get / - root param at /:param', async t => {
  t.plan(21)
  await setup(t, 'http', 'root-param')

  let result = await tiny.get({ url })
  checkHttpResult(t, result.body, {
    message: 'Hello from get /:param running the default runtime',
    routeKey: 'GET /{param}',
    rawPath: '/',
    pathParameters: { param: '' },
    cookies: undefined,
    queryStringParameters: undefined,
    rawQueryString: '',
    headers: '🤷🏽‍♀️',
    isBase64Encoded: false,
    body: undefined,
  })

  await shutdownAsync(t)
  teardown(t)
})

test('[HTTP v1.0 (REST) mode] get / - root param at /:param', async t => {
  t.plan(22)
  await setup(t, 'httpv1', 'root-param')

  let result = await tiny.get({ url })
  checkRestResult(t, result.body, {
    message: 'Hello from get /:param running the default runtime',
    resource: '/{param}',
    path: '/',
    httpMethod: 'GET',
    headers: '🤷🏽‍♀️',
    multiValueHeaders: '🤷🏽‍♀️',
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: { param: '' },
    body: null,
    isBase64Encoded: false,
  })

  await shutdownAsync(t)
  teardown(t)
})

// This shouldn't be possible, as /:param can't coexist with /{proxy+} ASAP in REST
test('[REST mode] get / - root param at /:param', async t => {
  t.plan(7)
  await setup(t, 'rest', 'root-param')

  try {
    await tiny.get({ url })
    t.fail(`Should not have gotten result`)
  }
  catch (err) {
    t.equal(err.statusCode, 403, 'Errors with 403')
  }

  await shutdownAsync(t)
  teardown(t)
})

/**
 * Nothing dynamic in root, all ASAP all the time
 */
test('[HTTP mode] get / - ASAP', async t => {
  t.plan(7)
  await setup(t, 'http', 'asap')

  let result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  await shutdownAsync(t)
  teardown(t)
})

test('[HTTP v1.0 (REST) mode] get / - ASAP', async t => {
  t.plan(7)
  await setup(t, 'httpv1', 'asap')

  let result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  await shutdownAsync(t)
  teardown(t)
})

test('[REST mode] get / - ASAP', async t => {
  t.plan(7)
  await setup(t, 'rest', 'asap')

  let result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  await shutdownAsync(t)
  teardown(t)
})

/**
 * Nothing dynamic in root, but only a bare @static - no @http
 */
test('[HTTP mode] get / - ASAP (@static only)', async t => {
  t.plan(7)
  await setup(t, 'http', 'bare-static')

  let result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  await shutdownAsync(t)
  teardown(t)
})

test('[HTTP v1.0 (REST) mode] get / - ASAP (@static only)', async t => {
  t.plan(7)
  await setup(t, 'httpv1', 'bare-static')

  let result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  await shutdownAsync(t)
  teardown(t)
})

test('[REST mode] get / - ASAP (@static only)', async t => {
  t.plan(7)
  await setup(t, 'rest', 'bare-static')

  let result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  await shutdownAsync(t)
  teardown(t)
})

/**
 * Root is greedy: retired for HTTP APIs in Arc 8, still available in REST mode
 */
test('[HTTP mode] get / - greedy index', async t => {
  t.plan(7)
  await setup(t, 'http', 'greedy-get-index')

  try {
    await tiny.get({ url: url + '/hi/there' })
    t.fail(`Should not have gotten result`)
  }
  catch (err) {
    t.equal(err.statusCode, 403, 'Errors with 403')
  }

  await shutdownAsync(t)
  teardown(t)
})

test('[HTTP v1.0 (REST) mode] get / - greedy index', async t => {
  t.plan(7)
  await setup(t, 'httpv1', 'greedy-get-index')

  try {
    await tiny.get({ url: url + '/hi/there' })
    t.fail(`Should not have gotten result`)
  }
  catch (err) {
    t.equal(err.statusCode, 403, 'Errors with 403')
  }

  await shutdownAsync(t)
  teardown(t)
})

test('[REST mode] get / - greedy index', async t => {
  t.plan(22)
  await setup(t, 'rest', 'greedy-get-index')

  let path = '/hi/there'
  let result = await tiny.get({ url: url + path })
  checkRestResult(t, result.body, {
    message: 'Hello from get / running the default runtime',
    resource: '/{proxy+}',
    path,
    httpMethod: 'GET',
    headers: '🤷🏽‍♀️',
    multiValueHeaders: '🤷🏽‍♀️',
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: { proxy: 'hi/there' },
    body: null,
    isBase64Encoded: false,
  })

  await shutdownAsync(t)
  teardown(t)
})
