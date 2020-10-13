let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { url, shutdown } = require('./_utils')

let cwd = process.cwd()
let mock = join(__dirname, '..', '..', 'mock')
let b64dec = i => Buffer.from(i, 'base64').toString()
let data = { hi: 'there' }
let has = (r, p) => Object.hasOwnProperty.call(r, p)

// Ok, I know this is a bit ridiculous, but I really don't want to have to manually check every param, so let's automate as many checks possible
function checkResult (t, result, checks) {
  t.ok(result, 'Got result!')
  let msgs = {
    correct: 'Returned correct param',
    returned: 'Returned unverified param',
    notReturned: 'Did not return'
  }
  let { version, body, pathParameters, routeKey, rawPath, requestContext } = result
  Object.entries(checks).forEach(([ param, value ]) => {
    if (param.startsWith('_')) { /* noop */ }
    else if (param === 'version') t.equal(version, '2.0', 'Got Lambda v2.0 payload')
    else if (param === 'body' && value) {
      t.equal(body, JSON.stringify(data), 'Got JSON-serialized body payload')
    }
    else if (value === undefined) {
      t.ok(!has(result, param), `${msgs.notReturned}: ${param}`)
    }
    else if (param === 'pathParameters') {
      let val = JSON.stringify(value)
      t.equal(JSON.stringify(pathParameters), val, `${msgs.correct} ${param}: ${val}`)
    }
    else if (value === '🤷🏽‍♀️') {
      t.ok(has(result, param), `${msgs.returned} ${param}`)
    }
    else {
      t.equal(result[param], value, `${msgs.correct} ${param}: ${value}`)
    }
  })
  let method = checks._method || routeKey.split(' ')[0]
  t.equal(requestContext.http.method, method, `Got correct requestContext.http.method param: ${method}`)
  t.equal(requestContext.http.path, rawPath, `Got correct requestContext.http.path param: ${rawPath}`)
  t.equal(requestContext.routeKey, routeKey, `Got correct requestContext.routeKey param: ${routeKey}`)
}

test('Set up env', t => {
  t.plan(1)
  process.env.ARC_API_TYPE = 'http'
  t.ok(sandbox, 'got sandbox')
})

test('[HTTP mode] Start Sandbox', t => {
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

test('[HTTP mode] get /', t => {
  t.plan(14)
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
      })
    }
  })
})

// TODO write some query string checks
// TODO write some cookie checks

test('[HTTP mode] get /binary', t => {
  t.plan(14)
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
      t.ok(img.includes('AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAA'), 'Body payload is binary')
    }
  })
})

test('[HTTP mode] get /nodejs12.x', t => {
  t.plan(14)
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

test('[HTTP mode] get /nodejs10.x', t => {
  t.plan(14)
  let rawPath = '/nodejs10.x'
  tiny.get({
    url: url + rawPath
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /nodejs10.x (running nodejs10.x)',
        routeKey: 'GET /nodejs10.x',
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

test('[HTTP mode] get /nodejs8.10', t => {
  t.plan(14)
  let rawPath = '/nodejs8.10'
  tiny.get({
    url: url + rawPath
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /nodejs8.10 (running nodejs8.10)',
        routeKey: 'GET /nodejs8.10',
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

test('[HTTP mode] get /python3.8', t => {
  t.plan(14)
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
      })
    }
  })
})

test('[HTTP mode] get /python3.7', t => {
  t.plan(14)
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

test('[HTTP mode] get /python3.6', t => {
  t.plan(14)
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

test('[HTTP mode] get /ruby2.5', t => {
  t.plan(14)
  let rawPath = '/ruby2.5'
  tiny.get({
    url: url + rawPath
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from Architect Sandbox running ruby2.5!',
        routeKey: 'GET /ruby2.5',
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

test('[HTTP mode] get /deno', t => {
  t.plan(14)
  let rawPath = '/deno'
  tiny.get({
    url: url + rawPath
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from Architect Sandbox running deno!',
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

test('[HTTP mode] get /path/*', t => {
  t.plan(14)
  let rawPath = '/path/hello/there'
  tiny.get({
    url: url + rawPath
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /path/* running the default runtime',
        routeKey: 'GET /path/{proxy+}',
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

test('[HTTP mode] get /no-return (noop)', t => {
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

// Write (POST, PUT, etc.) tests exercise HTTP API mode's implicit JSON passthrough
test('[HTTP mode] post /post (plain JSON)', t => {
  t.plan(14)
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

test('[HTTP mode] post /post (flavored JSON)', t => {
  t.plan(14)
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

test('[HTTP mode] put /put', t => {
  t.plan(14)
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

test('[HTTP mode] patch /patch', t => {
  t.plan(14)
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

test('[HTTP mode] delete /delete', t => {
  t.plan(14)
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

test('[HTTP mode] head /head', t => {
  t.plan(14)
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

test('[HTTP mode] options /options', t => {
  t.plan(14)
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

test('[HTTP mode] get /any', t => {
  t.plan(14)
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

test('[HTTP mode] post /any', t => {
  t.plan(14)
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

test('[HTTP mode] put /any', t => {
  t.plan(14)
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

test('[HTTP mode] patch /any', t => {
  t.plan(14)
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

test('[HTTP mode] delete /any', t => {
  t.plan(14)
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

test('[HTTP mode] head /any', t => {
  t.plan(14)
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

test('[HTTP mode] options /any', t => {
  t.plan(14)
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

test('[HTTP mode] get /any-c/*', t => {
  t.plan(14)
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

test('[HTTP mode] get /any-p/:param', t => {
  t.plan(14)
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

/**
 * Arc v8+: routes are now literal, no more greedy root (`any /{proxy+}`) fallthrough
 */
test('[HTTP mode] post / - route should fail when not explicitly defined', t => {
  t.plan(2)
  tiny.post({
    url,
    data,
  }, function _got (err, result) {
    if (err) {
      let message = '@http post /'
      t.equal(err.statusCode, 403, 'Errors with 403')
      t.ok(err.body.includes(message), `Errors with message instructing to add '${message}' handler`)
    }
    else t.fail(result)
  })
})

test('[HTTP mode] get /foobar - route should fail when not explicitly defined', t => {
  t.plan(2)
  tiny.get({
    url: url + '/foobar',
  }, function _got (err, result) {
    if (err) {
      let message = '@http get /foobar'
      t.equal(err.statusCode, 403, 'Errors with 403')
      t.ok(err.body.includes(message), `Errors with message instructing to add '${message}' handler`)
    }
    else t.fail(result)
  })
})

test('[HTTP mode] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Arc v6: test failing to load index.html without get / defined
 */
test('[HTTP mode] Start Sandbox', t => {
  t.plan(3)
  process.chdir(join(mock, 'no-index-fail'))
  sandbox.start({ quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[HTTP mode] get / without defining get / should fail if index.html not present', t => {
  t.plan(1)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.equal(err.statusCode, 404, 'Got 404 for missing file')
    else t.fail(result)
  })
})

test('[HTTP mode] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Arc v6: test successfully loading index.html without get / defined
 */
test('[HTTP mode] Start Sandbox', t => {
  t.plan(3)
  process.chdir(join(mock, 'no-index-pass'))
  sandbox.start({ quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[HTTP mode] get / without defining get / should succeed if index.html is present', t => {
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

test('[HTTP mode] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Test to ensure sandbox loads without defining @http
 */
test('[HTTP mode] Start Sandbox', t => {
  t.plan(1)
  process.chdir(join(mock, 'no-http'))
  sandbox.start({ quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Sandbox successfully started', 'Sandbox started')
  })
})

test('[HTTP mode] get / without defining @http', t => {
  t.plan(1)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.equal(err.code, 'ECONNREFUSED', 'Connection refused')
    else t.fail(result)
  })
})

test('[HTTP mode] Teardown', t => {
  t.plan(3)
  shutdown(t)
  delete process.env.ARC_API_TYPE
  process.chdir(cwd)
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
