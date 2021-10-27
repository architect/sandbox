let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { b64dec, checkHttpResult: checkResult, data, rmPublic, run, shutdown, startup, url, verifyShutdown } = require('../../utils')

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got Sandbox')
})

test('Run HTTP tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  let mode = `[HTTP mode / ${runType}]`

  t.test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'normal')
  })

  t.test(`${mode} get /`, t => {
    t.plan(16)
    tiny.get({
      url
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get / running the default runtime',
          routeKey: 'GET /',
          rawPath: '/',
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
          context: {
            awsRequestId: true, // Just check for presence
            functionName: 'sandbox-get-index',
            functionVersion: '$LATEST',
            invokedFunctionArn: 'sandbox',
            memoryLimitInMB: 1152,
          }
        })
      }
    })
  })

  t.test(`${mode} get /?whats=up`, t => {
    t.plan(15)
    let rawQueryString = 'whats=up'
    tiny.get({
      url: url + '/?' + rawQueryString
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get / running the default runtime',
          routeKey: 'GET /',
          rawPath: '/',
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: { whats: 'up' },
          rawQueryString,
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /?whats=up&whats=there`, t => {
    t.plan(15)
    let rawQueryString = 'whats=up&whats=there'
    tiny.get({
      url: url + '/?' + rawQueryString
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get / running the default runtime',
          routeKey: 'GET /',
          rawPath: '/',
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: { whats: 'up,there' },
          rawQueryString,
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get / + cookie`, t => {
    t.plan(15)
    let cookie = 'a=cookie'
    tiny.get({
      url,
      headers: { cookie }
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get / running the default runtime',
          routeKey: 'GET /',
          rawPath: '/',
          pathParameters: undefined,
          cookies: [ cookie ],
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /multi-cookies-res`, t => {
    t.plan(1)
    tiny.get({
      url: url + '/multi-cookies-res'
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        t.deepEqual(
          result.headers['set-cookie'],
          [ 'c1=v1', 'c2=v2' ],
          'Response contains 2 set-cookie headers'
        )
      }
    })
  })

  t.test(`${mode} get /binary`, t => {
    t.plan(15)
    let rawPath = '/binary'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, JSON.parse(result.headers.body), {
          message: 'Hello from get /binary',
          routeKey: 'GET /binary',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
        })
        const img = Buffer.from(result.body).toString('base64')
        t.match(img, /AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAA/, 'Body payload is binary')
      }
    })
  })

  t.test(`${mode} get /nodejs14.x`, t => {
    t.plan(15)
    let rawPath = '/nodejs14.x'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /nodejs14.x (running nodejs14.x)',
          routeKey: 'GET /nodejs14.x',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /nodejs12.x`, t => {
    t.plan(15)
    let rawPath = '/nodejs12.x'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /nodejs12.x (running nodejs12.x)',
          routeKey: 'GET /nodejs12.x',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /python3.8`, t => {
    t.plan(16)
    let rawPath = '/python3.8'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /python3.8 (running python3.8)',
          routeKey: 'GET /python3.8',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
          context: {
            aws_request_id: true, // Just check for presence
            function_name: 'sandbox-get-python3_8',
            function_version: '$LATEST',
            invoked_function_arn: 'sandbox',
            memory_limit_in_mb: 1152,
          }
        })
      }
    })
  })

  t.test(`${mode} get /python3.7`, t => {
    t.plan(15)
    let rawPath = '/python3.7'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /python3.7 (running python3.7)',
          routeKey: 'GET /python3.7',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /python3.6`, t => {
    t.plan(15)
    let rawPath = '/python3.6'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /python3.6 (running python3.6)',
          routeKey: 'GET /python3.6',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /ruby2.7`, t => {
    t.plan(16)
    let rawPath = '/ruby2.7'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /ruby2.7 (running ruby2.7)',
          routeKey: 'GET /ruby2.7',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
          context: {
            aws_request_id: true, // Just check for presence
            function_name: 'sandbox-get-ruby2_7',
            function_version: '$LATEST',
            invoked_function_arn: 'sandbox',
            memory_limit_in_mb: 1152,
          }
        })
      }
    })
  })

  t.test(`${mode} get /deno`, t => {
    t.plan(15)
    let rawPath = '/deno'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /deno (running deno)',
          routeKey: 'GET /deno',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /get-c/*`, t => {
    t.plan(15)
    let rawPath = '/get-c/hello/there'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /get-c/*',
          routeKey: 'GET /get-c/{proxy+}',
          rawPath,
          cookies: undefined,
          queryStringParameters: undefined,
          pathParameters: { proxy: 'hello/there' },
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /get-p-c/:param/*`, t => {
    t.plan(15)
    let rawPath = '/get-p-c/why/hello/there'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from any /get-p-c/:param/*',
          routeKey: 'GET /get-p-c/{param}/{proxy+}',
          rawPath,
          cookies: undefined,
          queryStringParameters: undefined,
          pathParameters: {
            param: 'why',
            proxy: 'hello/there'
          },
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /no-return (noop)`, t => {
    t.plan(3)
    let rawPath = '/no-return'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        t.ok(result, 'got /no-return')
        let { headers, body } = result
        t.equal(headers['content-type'], 'application/json', 'Returned JSON response')
        // FYI: Tiny parses 'null' into a null literal
        t.equal(body, null, `Got 'null' string back, which is definitely not valid JSON`)
      }
    })
  })

  t.test(`${mode} get /promise-return (returned promise vs async function)`, t => {
    t.plan(2)
    let rawPath = '/promise-return'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        t.ok(result, 'got /promise-return')
        let { body } = result
        t.equal(body.message, 'Hello from get /promise-return', `Got 'Hello from get promise-return' string back`)
      }
    })
  })

  t.test(`${mode} get /custom`, t => {
    t.plan(15)
    let rawPath = '/custom'
    tiny.get({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /custom',
          routeKey: 'GET /custom',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  // Write (POST, PUT, etc.) tests exercise HTTP API mode's implicit JSON passthrough
  t.test(`${mode} post /post (plain JSON)`, t => {
    t.plan(15)
    let rawPath = '/post'
    tiny.post({
      url: url + rawPath,
      data,
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from post /post',
          routeKey: 'POST /post',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: true,
        })
      }
    })
  })

  t.test(`${mode} post /post (flavored JSON)`, t => {
    t.plan(15)
    let rawPath = '/post'
    tiny.post({
      url: url + rawPath,
      data,
      headers: { 'Content-Type': 'application/ld+json' }, // Exercise the JSON regex
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from post /post',
          routeKey: 'POST /post',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: true,
        })
      }
    })
  })

  t.test(`${mode} put /put`, t => {
    t.plan(15)
    let rawPath = '/put'
    tiny.put({
      url: url + rawPath,
      data,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from put /put',
          routeKey: 'PUT /put',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: true,
        })
        t.equal(b64dec(result.body.body), 'hi=there', 'Got base64-encoded form URL-encoded body payload')
      }
    })
  })

  t.test(`${mode} patch /patch`, t => {
    t.plan(15)
    let rawPath = '/patch'
    tiny.patch({
      url: url + rawPath,
      data,
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from patch /patch',
          routeKey: 'PATCH /patch',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: true,
        })
      }
    })
  })

  t.test(`${mode} delete /delete`, t => {
    t.plan(15)
    let rawPath = '/delete'
    tiny.del({
      url: url + rawPath,
      data,
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from delete /delete',
          routeKey: 'DELETE /delete',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: true,
        })
      }
    })
  })

  t.test(`${mode} head /head`, t => {
    t.plan(15)
    let rawPath = '/head'
    tiny.head({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, JSON.parse(result.headers.body), {
          message: 'Hello from head /head',
          routeKey: 'HEAD /head',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} options /options`, t => {
    t.plan(15)
    let rawPath = '/options'
    tiny.options({
      url: url + rawPath
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from options /options',
          routeKey: 'OPTIONS /options',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /any`, t => {
    t.plan(15)
    let rawPath = '/any'
    tiny.get({
      url: url + rawPath,
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from any /any',
          routeKey: 'ANY /any',
          _method: 'GET',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} post /any`, t => {
    t.plan(15)
    let rawPath = '/any'
    tiny.post({
      url: url + rawPath,
      data,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from any /any',
          routeKey: 'ANY /any',
          _method: 'POST',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: true,
        })
        t.equal(b64dec(result.body.body), 'hi=there', 'Got base64-encoded form URL-encoded body payload')
      }
    })
  })

  t.test(`${mode} put /any`, t => {
    t.plan(15)
    let rawPath = '/any'
    tiny.put({
      url: url + rawPath,
      data,
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from any /any',
          routeKey: 'ANY /any',
          _method: 'PUT',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: true,
        })
      }
    })
  })

  t.test(`${mode} patch /any`, t => {
    t.plan(15)
    let rawPath = '/any'
    tiny.patch({
      url: url + rawPath,
      data,
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from any /any',
          routeKey: 'ANY /any',
          _method: 'PATCH',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: true,
        })
      }
    })
  })

  t.test(`${mode} delete /any`, t => {
    t.plan(15)
    let rawPath = '/any'
    tiny.del({
      url: url + rawPath,
      data,
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from any /any',
          routeKey: 'ANY /any',
          _method: 'DELETE',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: true,
        })
      }
    })
  })

  t.test(`${mode} head /any`, t => {
    t.plan(15)
    let rawPath = '/any'
    tiny.head({
      url: url + rawPath,
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, JSON.parse(result.headers.body), {
          message: 'Hello from any /any',
          routeKey: 'ANY /any',
          _method: 'HEAD',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} options /any`, t => {
    t.plan(15)
    let rawPath = '/any'
    tiny.options({
      url: url + rawPath,
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from any /any',
          routeKey: 'ANY /any',
          _method: 'OPTIONS',
          rawPath,
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /any-c/*`, t => {
    t.plan(15)
    let rawPath = '/any-c/hello/there'
    tiny.get({
      url: url + rawPath,
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from any /any-c/*',
          routeKey: 'ANY /any-c/{proxy+}',
          _method: 'GET',
          rawPath,
          pathParameters: { proxy: 'hello/there' },
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /any-p/:param`, t => {
    t.plan(15)
    let rawPath = '/any-p/hello'
    tiny.get({
      url: url + rawPath,
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from any /any-p/:param',
          routeKey: 'ANY /any-p/{param}',
          _method: 'GET',
          rawPath,
          pathParameters: { param: 'hello' },
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
        })
      }
    })
  })

  t.test(`${mode} get /reject-promise should fail`, t => {
    t.plan(2)
    tiny.get({
      url: url + '/reject-promise'
    }, function _got (err) {
      if (err) {
        t.equal(err.statusCode, 500, 'Got 500 for function error')
        t.match(err.body, /Hello from get \/reject-promise/, 'Got function error')
      }
      else {
        t.fail('request should have failed')
      }
    })
  })

  t.test(`${mode} get /throw-sync-error should fail`, t => {
    t.plan(2)
    tiny.get({
      url: url + '/throw-sync-error'
    }, function _got (err) {
      if (err) {
        t.equal(err.statusCode, 500, 'Got 500 for function error')
        t.match(err.body, /Hello from get \/throw-sync-error/, 'Got function error')
      }
      else {
        t.fail('request should have failed')
      }
    })
  })

  /**
   * Arc v8+: routes are now literal, no more greedy root (`any /{proxy+}`) fallthrough
   */
  t.test(`${mode} post / - route should fail when not explicitly defined`, t => {
    t.plan(2)
    tiny.post({
      url,
      data,
    }, function _got (err, result) {
      if (err) {
        let message = '@http post /'
        t.equal(err.statusCode, 403, 'Errors with 403')
        t.match(err.body, new RegExp(message), `Errors with message instructing to add '${message}' handler`)
      }
      else t.fail(result)
    })
  })

  t.test(`${mode} get /foobar - route should fail when not explicitly defined`, t => {
    t.plan(2)
    tiny.get({
      url: url + '/foobar',
    }, function _got (err, result) {
      if (err) {
        let message = '@http get /foobar'
        t.equal(err.statusCode, 403, 'Errors with 403')
        t.match(err.body, new RegExp(message), `Errors with message instructing to add '${message}' handler`)
      }
      else t.fail(result)
    })
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  /**
   * Arc v6: test failing to load index.html without get / defined
   */
  t.test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'no-index-fail')
  })

  t.test(`${mode} get / without defining get / should fail if index.html not present`, t => {
    t.plan(2)
    rmPublic(t)
    tiny.get({
      url
    }, function _got (err, result) {
      if (err) t.equal(err.statusCode, 404, 'Got 404 for missing file')
      else t.fail(result)
    })
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  /**
   * Arc v6: test successfully loading index.html without get / defined
   */
  t.test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'no-index-pass')
  })

  t.test(`${mode} get / without defining get / should succeed if index.html is present`, t => {
    t.plan(2)
    tiny.get({
      url
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        t.ok(result, 'got /')
        let { body } = result
        t.equal(body, 'Hello world!')
      }
    })
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  /**
   * Arc v6: test failing to load an endpoint missing its local handler file
   */
  t.test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'missing-handler')
  })

  t.test(`${mode} get /missing should fail if missing its handler file`, t => {
    t.plan(2)
    tiny.get({
      url: url + '/missing'
    }, function _got (err, result) {
      if (err) {
        t.equal(err.statusCode, 502, 'Got 502 for missing file')
        t.match(err.body, /Lambda handler not found/, 'Got correct error')
      }
      else t.fail(result)
    })
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  /**
   * Test to ensure sandbox loads without defining @http
   */
  t.test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'no-http')
  })

  t.test(`${mode} get / without defining @http`, t => {
    t.plan(1)
    verifyShutdown(t, 'not actually shut down, just not using @http')
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
