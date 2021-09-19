let { join } = require('path')
let { existsSync } = require('fs')
let tiny = require('tiny-json-http')
let test = require('tape')
let sandbox = require('../../../src')
let { url, startupNew: startup, checkHttpResult, checkRestResult, teardown } = require('./_utils')
let indexHTML = 'Hello from public/index.html!'

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got sandbox')
})

test('Module', t => {
  runTests('module')
  t.end()
})

test('Binary', t => {
  let bin = join(process.cwd(), 'bin', 'sandbox-binary')
  if (existsSync(bin)) {
    runTests('binary')
    t.end()
  }
  else t.end()
})

function runTests (runType) {
  /**
   * Root param with nested exact match: /:param/there
   */
  test(`[HTTP mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'param-exact'), 'http')
  })

  test(`[HTTP mode / ${runType}] get /hi/there - root param at /:param/there`, async t => {
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

  test(`[HTTP mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })


  test(`[HTTP v1.0 (REST) mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'param-exact'), 'httpv1')
  })

  test(`[HTTP v1.0 (REST) mode / ${runType}] get /hi/there - root param at /:param/there`, async t => {
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

  test(`[HTTP v1.0 (REST) mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })

  // TODO fix this test, see: arc#982
  // This shouldn't be possible, as /:param/whatever can't coexist with /{proxy+} ASAP in REST
  /*
  test('[REST mode] get /hi/there - root param at /:param/there', async t => {
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
  test(`[HTTP mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'root-param'), 'http')
  })

  test(`[HTTP mode / ${runType}] get / - root param at /:param`, async t => {
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

  test(`[HTTP mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })


  test(`[HTTP v1.0 (REST) mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'root-param'), 'httpv1')
  })

  test(`[HTTP v1.0 (REST) mode / ${runType}] get / - root param at /:param`, async t => {
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

  test(`[HTTP v1.0 (REST) mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })


  // This shouldn't be possible, as /:param can't coexist with /{proxy+} ASAP in REST
  test(`[REST mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'root-param'), 'rest')
  })

  test(`[REST mode / ${runType}] get / - root param at /:param`, async t => {
    t.plan(1)
    try {
      await tiny.get({ url })
      t.fail(`Should not have gotten result`)
    }
    catch (err) {
      t.equal(err.statusCode, 403, 'Errors with 403')
    }
  })

  test(`[REST mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })

  /**
   * Nothing dynamic in root, all ASAP all the time
   */
  test(`[HTTP mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'asap'), 'http')
  })

  test(`[HTTP mode / ${runType}] get / - ASAP`, async t => {
    t.plan(1)
    let result = await tiny.get({ url })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  test(`[HTTP mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })


  test(`[HTTP v1.0 (REST) mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'asap'), 'httpv1')
  })

  test(`[HTTP v1.0 (REST) mode / ${runType}] get / - ASAP`, async t => {
    t.plan(1)
    let result = await tiny.get({ url })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  test(`[HTTP v1.0 (REST) mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })


  test(`[REST mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'asap'), 'rest')
  })

  test(`[REST mode / ${runType}] get / - ASAP`, async t => {
    t.plan(1)
    let result = await tiny.get({ url })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  test(`[REST mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })


  /**
   * Nothing dynamic in root, but only a bare @static - no @http
   */
  test(`[HTTP mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'bare-static'), 'http')
  })

  test(`[HTTP mode / ${runType}] get / - ASAP (@static only)`, async t => {
    t.plan(1)
    let result = await tiny.get({ url })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  test(`[HTTP mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })


  test(`[HTTP v1.0 (REST) mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'bare-static'), 'httpv1')
  })

  test(`[HTTP v1.0 (REST) mode / ${runType}] get / - ASAP (@static only)`, async t => {
    t.plan(1)
    let result = await tiny.get({ url })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  test(`[HTTP v1.0 (REST) mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })


  test(`[REST mode mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'bare-static'), 'rest')
  })

  test(`[REST mode / ${runType}] get / - ASAP (@static only)`, async t => {
    t.plan(1)
    let result = await tiny.get({ url })
    t.ok(result.body.startsWith(indexHTML), 'Got static index.html')
  })

  test(`[REST mode mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })


  /**
   * Root is greedy: retired for HTTP APIs in Arc 8, still available in REST mode
   */
  test(`[HTTP mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'greedy-get-index'), 'http')
  })

  test(`[HTTP mode / ${runType}] get / - greedy index`, async t => {
    t.plan(1)
    try {
      await tiny.get({ url: url + '/hi/there' })
      t.fail(`Should not have gotten result`)
    }
    catch (err) {
      t.equal(err.statusCode, 403, 'Errors with 403')
    }
  })

  test(`[HTTP mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })


  test(`[HTTP v1.0 (REST) mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'greedy-get-index'), 'httpv1')
  })

  test(`[HTTP v1.0 (REST) mode / ${runType}] get / - greedy index`, async t => {
    t.plan(1)
    try {
      await tiny.get({ url: url + '/hi/there' })
      t.fail(`Should not have gotten result`)
    }
    catch (err) {
      t.equal(err.statusCode, 403, 'Errors with 403')
    }
  })

  test(`[HTTP v1.0 (REST) mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })


  test(`[REST mode / ${runType}] Start Sandbox`, t => {
    startup[runType](t, join('root-handling', 'greedy-get-index'), 'rest')
  })

  test(`[REST mode / ${runType}] get / - greedy index`, async t => {
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

  test(`[REST mode / ${runType}] Shut down Sandbox`, t => {
    teardown[runType](t)
  })
}
