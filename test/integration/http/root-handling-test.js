let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sandbox = require('../../../src')
let { checkRestResult, checkHttpResult, run, startup, shutdown, url } = require('../../utils')
let indexHTML = 'Hello from public/index.html!'

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got sandbox')
})

test('Run root handling tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  /**
   * Root param with nested exact match: /:param/there
   */
  t.test(`[HTTP mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'param-exact'), { apigateway: 'http' })
  })

  t.test(`[HTTP mode / ${runType}] get /hi/there - root param at /:param/there`, async t => {
    t.plan(16)

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
  })

  t.test(`[HTTP mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })


  t.test(`[HTTP v1.0 (REST) mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'param-exact'), { apigateway: 'httpv1' })
  })

  t.test(`[HTTP v1.0 (REST) mode / ${runType}] get /hi/there - root param at /:param/there`, async t => {
    t.plan(17)
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
  })

  t.test(`[HTTP v1.0 (REST) mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  // TODO fix this test, see: arc#982
  // This shouldn't be possible, as /:param/whatever can't coexist with /{proxy+} ASAP in REST
  /*
  t.test('[REST mode] get /hi/there - root param at /:param/there', async t => {
    setup(t, 'rest', 'param-exact')
    try {
      await tiny.get({ url: url + '/hi/there' })
      t.fail(`Should not have gotten result`)
    }
    catch (err) {
      t.equal(err.statusCode, 403, 'Errors with 403')
    }
  })
  */

  /**
   * Root param only: /:param
   */
  t.test(`[HTTP mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'root-param'), { apigateway: 'http' })
  })

  t.test(`[HTTP mode / ${runType}] get / - root param at /:param`, async t => {
    t.plan(15)
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
  })

  t.test(`[HTTP mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })


  t.test(`[HTTP v1.0 (REST) mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'root-param'), { apigateway: 'httpv1' })
  })

  t.test(`[HTTP v1.0 (REST) mode / ${runType}] get / - root param at /:param`, async t => {
    t.plan(16)
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
  })

  t.test(`[HTTP v1.0 (REST) mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })


  // This shouldn't be possible, as /:param can't coexist with /{proxy+} ASAP in REST
  t.test(`[REST mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'root-param'), { apigateway: 'rest' })
  })

  t.test(`[REST mode / ${runType}] get / - root param at /:param`, async t => {
    t.plan(1)
    try {
      await tiny.get({ url })
      t.fail(`Should not have gotten result`)
    }
    catch (err) {
      t.equal(err.statusCode, 403, 'Errors with 403')
    }
  })

  t.test(`[REST mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  /**
   * Nothing dynamic in root, all ASAP all the time
   */
  t.test(`[HTTP mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'asap'), { apigateway: 'http' })
  })

  t.test(`[HTTP mode / ${runType}] get / - ASAP`, async t => {
    t.plan(1)
    let result = await tiny.get({ url })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  // Case-sensitivity check
  t.test(`[HTTP mode / ${runType}] get /index.html - ASAP`, async t => {
    t.plan(1)
    let result = await tiny.get({ url: url + '/index.html' })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  // This should always fail
  t.test(`[HTTP mode / ${runType}] get /index.HTML - ASAP`, async t => {
    t.plan(3)
    try {
      await tiny.get({ url: url + '/index.HTML' })
      t.fail('Expected an error')
    }
    catch (err) {
      let { body, statusCode } = err
      t.match(body, /NoSuchKey/, 'Got back NoSuchKey error')
      t.match(body, /index.HTML/, 'Got back filename')
      t.equal(statusCode, 404, 'Got back 404')
    }
  })

  t.test(`[HTTP mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })


  t.test(`[HTTP v1.0 (REST) mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'asap'), { apigateway: 'httpv1' })
  })

  t.test(`[HTTP v1.0 (REST) mode / ${runType}] get / - ASAP`, async t => {
    t.plan(1)
    let result = await tiny.get({ url })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  t.test(`[HTTP v1.0 (REST) mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })


  t.test(`[REST mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'asap'), { apigateway: 'rest' })
  })

  t.test(`[REST mode / ${runType}] get / - ASAP`, async t => {
    t.plan(1)
    let result = await tiny.get({ url })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  t.test(`[REST mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })


  /**
   * Nothing dynamic in root, but only a bare @static - no @http
   */
  t.test(`[HTTP mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'bare-static'), { apigateway: 'http' })
  })

  t.test(`[HTTP mode / ${runType}] get / - ASAP (@static only)`, async t => {
    t.plan(1)
    let result = await tiny.get({ url })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  t.test(`[HTTP mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })


  t.test(`[HTTP v1.0 (REST) mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'bare-static'), { apigateway: 'httpv1' })
  })

  t.test(`[HTTP v1.0 (REST) mode / ${runType}] get / - ASAP (@static only)`, async t => {
    t.plan(1)
    let result = await tiny.get({ url })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  t.test(`[HTTP v1.0 (REST) mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })


  t.test(`[REST mode mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'bare-static'), { apigateway: 'rest' })
  })

  t.test(`[REST mode / ${runType}] get / - ASAP (@static only)`, async t => {
    t.plan(1)
    let result = await tiny.get({ url })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  t.test(`[REST mode mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })


  /**
   * Root is greedy: retired for HTTP APIs in Arc 8, still available in REST mode
   */
  t.test(`[HTTP mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'greedy-get-index'), { apigateway: 'http' })
  })

  t.test(`[HTTP mode / ${runType}] get / - greedy index`, async t => {
    t.plan(1)
    try {
      await tiny.get({ url: url + '/hi/there' })
      t.fail(`Should not have gotten result`)
    }
    catch (err) {
      t.equal(err.statusCode, 403, 'Errors with 403')
    }
  })

  t.test(`[HTTP mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })


  t.test(`[HTTP v1.0 (REST) mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'greedy-get-index'), { apigateway: 'httpv1' })
  })

  t.test(`[HTTP v1.0 (REST) mode / ${runType}] get / - greedy index`, async t => {
    t.plan(1)
    try {
      await tiny.get({ url: url + '/hi/there' })
      t.fail(`Should not have gotten result`)
    }
    catch (err) {
      t.equal(err.statusCode, 403, 'Errors with 403')
    }
  })

  t.test(`[HTTP v1.0 (REST) mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })


  t.test(`[REST mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'greedy-get-index'), { apigateway: 'rest' })
  })

  t.test(`[REST mode / ${runType}] get / - greedy index`, async t => {
    t.plan(16)
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
  })

  t.test(`[REST mode / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
