let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sandbox = require('../../../src')
let { url, shutdownAsync } = require('./_utils')

let cwd = process.cwd()
let indexHTML = 'Hello from public/index.html!'

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'got sandbox')
})

async function setup (t, type, dir) {
  process.env.ARC_API_TYPE = type
  process.chdir(join(__dirname, '..', '..', 'mock', 'root-handling', dir))
  let start = await sandbox.start({ quiet: true })
  t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
  t.equal(process.env.ARC_API_TYPE, type, `API type set to ${type}`)
  t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
  t.equal(start, 'Sandbox successfully started', 'Sandbox started')
}
function teardown (t) {
  delete process.env.ARC_API_TYPE
  process.chdir(cwd)
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
}

/**
 * Root param with nested exact match: /:param/there
 */
test('[HTTP mode] get /hi/there - root param at /:param/there', async t => {
  t.plan(17)
  await setup(t, 'http', 'param-exact')

  let result
  result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  result = await tiny.get({ url: url + '/hi/there' })
  t.ok(result, 'got /hi/there')
  let { message, version, routeKey, rawPath, pathParameters, requestContext } = result.body
  t.equal(version, '2.0', 'Got Lambda v2.0 payload')
  t.equal(routeKey, 'GET /{param}/there', 'Got correct routeKey')
  t.equal(message, 'Hello from get /:param/there running the default runtime', 'Got correct handler response')
  t.equal(rawPath, '/hi/there', 'Got correct rawPath')
  t.equal(pathParameters.param, 'hi', 'Got correct pathParameters.param')
  t.equal(requestContext.http.method, 'GET', 'Got correct method')
  t.equal(requestContext.http.path, '/hi/there', 'Got correct requestContext.http.path param')
  t.equal(requestContext.routeKey, 'GET /{param}/there', 'Got correct requestContext.routeKey param')

  await shutdownAsync(t)
  teardown(t)
})

test('[HTTP v1.0 (REST) mode] get /hi/there - root param at /:param/there', async t => {
  t.plan(16)
  await setup(t, 'httpv1', 'param-exact')

  let result
  result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  result = await tiny.get({ url: url + '/hi/there' })
  t.ok(result, 'got /hi/there')
  let { message, version, resource, path, pathParameters, requestContext } = result.body
  t.equal(version, '1.0', 'Got Lambda v2.0 payload')
  t.equal(message, 'Hello from get /:param/there running the default runtime', 'Got correct handler response')
  t.equal(resource, '/{param}/there', 'Got correct resource param')
  t.equal(path, '/hi/there', 'Got correct path param')
  t.equal(pathParameters.param, 'hi', 'Got correct pathParameters.proxy')
  t.equal(requestContext.path, '/hi/there', 'Got correct requestContext.path param')
  t.equal(requestContext.resourcePath, '/{param}/there', 'Got correct requestContext.resourcePath param')

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
  t.plan(17)
  await setup(t, 'http', 'root-param')

  let result = await tiny.get({ url })
  t.ok(result, 'got /')
  let { message, version, routeKey, rawPath, pathParameters, requestContext } = result.body
  t.equal(version, '2.0', 'Got Lambda v2.0 payload')
  t.equal(routeKey, 'GET /{param}', 'Got correct routeKey')
  t.equal(message, 'Hello from get /:param running the default runtime', 'Got correct handler response')
  t.equal(requestContext.http.method, 'GET', 'Got correct method')
  t.equal(rawPath, '/', 'Got correct rawPath')
  t.equal(pathParameters.param, '', 'Got correct pathParameters.param')
  t.equal(requestContext.http.method, 'GET', 'Got correct method')
  t.equal(requestContext.http.path, '/', 'Got correct requestContext.http.path param')
  t.equal(requestContext.routeKey, 'GET /{param}', 'Got correct requestContext.routeKey param')

  await shutdownAsync(t)
  teardown(t)
})

test('[HTTP v1.0 (REST) mode] get / - root param at /:param', async t => {
  t.plan(15)
  await setup(t, 'httpv1', 'root-param')

  let result = await tiny.get({ url })
  t.ok(result, 'got /')
  let { message, version, resource, path, pathParameters, requestContext } = result.body
  t.equal(version, '1.0', 'Got Lambda v2.0 payload')
  t.equal(message, 'Hello from get /:param running the default runtime', 'Got correct handler response')
  t.equal(resource, '/{param}', 'Got correct resource param')
  t.equal(path, '/', 'Got correct path param')
  t.equal(pathParameters.param, '', 'Got correct pathParameters.proxy')
  t.equal(requestContext.path, '/', 'Got correct requestContext.path param')
  t.equal(requestContext.resourcePath, '/{param}', 'Got correct requestContext.resourcePath param')

  await shutdownAsync(t)
  teardown(t)
})

// This shouldn't be possible, as /:param can't coexist with /{proxy+} ASAP in REST
test('[REST mode] get / - root param at /:param', async t => {
  t.plan(8)
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
  t.plan(8)
  await setup(t, 'http', 'asap')

  let result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  await shutdownAsync(t)
  teardown(t)
})

test('[HTTP v1.0 (REST) mode] get / - ASAP', async t => {
  t.plan(8)
  await setup(t, 'httpv1', 'asap')

  let result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  await shutdownAsync(t)
  teardown(t)
})

test('[REST mode] get / - ASAP', async t => {
  t.plan(8)
  await setup(t, 'rest', 'asap')

  let result = await tiny.get({ url })
  t.ok(result.body.startsWith(indexHTML), 'Got static index.html')

  await shutdownAsync(t)
  teardown(t)
})

/**
 * Root is greedy: retired for HTTP APIs in Arc 8, still available in REST mode
 */
test('[HTTP mode] get / - greedy index', async t => {
  t.plan(8)
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
  t.plan(8)
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
  t.plan(15)
  await setup(t, 'rest', 'greedy-get-index')

  let result = await tiny.get({ url: url + '/hi/there' })
  t.ok(result, 'got /')
  let { message, version, resource, path, pathParameters, requestContext } = result.body
  t.notOk(version, 'No Lambda payload version specified')
  t.equal(message, 'Hello from get / running the default runtime', 'Got correct handler response')
  t.equal(resource, '/{proxy+}', 'Got correct resource param')
  t.equal(path, '/hi/there', 'Got correct path param')
  t.equal(pathParameters.proxy, 'hi/there', 'Got null pathParameters.proxy')
  t.equal(requestContext.path, '/hi/there', 'Got correct requestContext.path param')
  t.equal(requestContext.resourcePath, '/{proxy+}', 'Got correct requestContext.resourcePath param')

  await shutdownAsync(t)
  teardown(t)
})
