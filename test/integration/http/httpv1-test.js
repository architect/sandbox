let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { url, data, shutdown, checkRestResult: checkResult } = require('./_utils')

let cwd = process.cwd()
let mock = join(__dirname, '..', '..', 'mock')
let b64dec = i => Buffer.from(i, 'base64').toString()

test('Set up env', t => {
  t.plan(1)
  process.env.ARC_API_TYPE = 'httpv1'
  t.ok(sandbox, 'got sandbox')
})

test('[HTTP v1.0 (REST) mode] Start Sandbox', t => {
  t.plan(4)
  process.chdir(join(mock, 'normal'))
  sandbox.start({ quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'httpv1', 'API type set to httpv1')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /', t => {
  t.plan(16)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get / running the default runtime',
        resource: '/',
        path: '/',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

// TODO write some query string checks
// TODO write some cookie checks

test('[HTTP v1.0 (REST) mode] get /binary', t => {
  t.plan(17)
  let path = '/binary'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, JSON.parse(result.headers.body), {
        message: 'Hello from get /binary',
        resource: path,
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
      const img = Buffer.from(result.body).toString('base64')
      t.ok(img.includes('AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAA'), 'is binary')
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /nodejs12.x', t => {
  t.plan(16)
  let path = '/nodejs12.x'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /nodejs12.x (running nodejs12.x)',
        resource: path,
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /nodejs10.x', t => {
  t.plan(16)
  let path = '/nodejs10.x'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /nodejs10.x (running nodejs10.x)',
        resource: path,
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /nodejs8.10', t => {
  t.plan(16)
  let path = '/nodejs8.10'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /nodejs8.10 (running nodejs8.10)',
        resource: path,
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /python3.8', t => {
  t.plan(16)
  let path = '/python3.8'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /python3.8 (running python3.8)',
        resource: path,
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /python3.7', t => {
  t.plan(16)
  let path = '/python3.7'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /python3.7 (running python3.7)',
        resource: path,
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /python3.6', t => {
  t.plan(16)
  let path = '/python3.6'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /python3.6 (running python3.6)',
        resource: path,
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /ruby2.5', t => {
  t.plan(16)
  let path = '/ruby2.5'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from Architect Sandbox running ruby2.5!',
        resource: path,
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /deno', t => {
  t.plan(16)
  let path = '/deno'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from Architect Sandbox running deno!',
        resource: path,
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /path/*', t => {
  t.plan(16)
  let path = '/path/hello/there'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /path/* running the default runtime',
        resource: '/path/{proxy+}',
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: { proxy: 'hello/there' },
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /no-return (noop)', t => {
  t.plan(2)
  tiny.get({
    url: url + '/no-return'
  }, function _got (err, result) {
    if (err) {
      let message = 'Async error'
      t.equal(err.statusCode, 500, 'Errors with 500')
      t.ok(err.body.includes(message), `Errors with message: '${message}'`)
    }
    else t.fail(result)
  })
})

test('[HTTP v1.0 (REST) mode] post /post', t => {
  t.plan(16)
  let path = '/post'
  tiny.post({
    url: url + path,
    data,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from post /post',
        resource: path,
        path,
        httpMethod: 'POST',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        isBase64Encoded: true,
      })
      t.equal(b64dec(result.body.body), 'hi=there', 'Got base64-encoded form URL-encoded body payload')
    }
  })
})

test('[HTTP v1.0 (REST) mode] put /put', t => {
  t.plan(16)
  let path = '/put'
  tiny.put({
    url: url + path,
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from put /put',
        resource: path,
        path,
        httpMethod: 'PUT',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: true,
        isBase64Encoded: true,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] patch /patch', t => {
  t.plan(16)
  let path = '/patch'
  tiny.patch({
    url: url + path,
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from patch /patch',
        resource: path,
        path,
        httpMethod: 'PATCH',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: true,
        isBase64Encoded: true,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] delete /delete', t => {
  t.plan(16)
  let path = '/delete'
  tiny.del({
    url: url + path,
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from delete /delete',
        resource: path,
        path,
        httpMethod: 'DELETE',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: true,
        isBase64Encoded: true,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] head /head', t => {
  t.plan(16)
  let path = '/head'
  tiny.head({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, JSON.parse(result.headers.body), {
        message: 'Hello from head /head',
        resource: path,
        path,
        httpMethod: 'HEAD',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] options /options', t => {
  t.plan(16)
  let path = '/options'
  tiny.options({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from options /options',
        resource: path,
        path,
        httpMethod: 'OPTIONS',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /any', t => {
  t.plan(16)
  let path = '/any'
  tiny.get({
    url: url + path,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from any /any',
        resource: path,
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] post /any', t => {
  t.plan(16)
  let path = '/any'
  tiny.post({
    url: url + path,
    data,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from any /any',
        resource: path,
        path,
        httpMethod: 'POST',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        isBase64Encoded: true,
      })
      t.equal(b64dec(result.body.body), 'hi=there', 'Got base64-encoded form URL-encoded body payload')
    }
  })
})

test('[HTTP v1.0 (REST) mode] put /any', t => {
  t.plan(16)
  let path = '/any'
  tiny.put({
    url: url + path,
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from any /any',
        resource: path,
        path,
        httpMethod: 'PUT',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: true,
        isBase64Encoded: true,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] patch /any', t => {
  t.plan(16)
  let path = '/any'
  tiny.patch({
    url: url + path,
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from any /any',
        resource: path,
        path,
        httpMethod: 'PATCH',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: true,
        isBase64Encoded: true,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] delete /any', t => {
  t.plan(16)
  let path = '/any'
  tiny.del({
    url: url + path,
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from any /any',
        resource: path,
        path,
        httpMethod: 'DELETE',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: true,
        isBase64Encoded: true,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] head /any', t => {
  t.plan(16)
  let path = '/any'
  tiny.head({
    url: url + path,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, JSON.parse(result.headers.body), {
        message: 'Hello from any /any',
        resource: path,
        path,
        httpMethod: 'HEAD',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] options /any', t => {
  t.plan(16)
  let path = '/any'
  tiny.options({
    url: url + path,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from any /any',
        resource: path,
        path,
        httpMethod: 'OPTIONS',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /any-c/*', t => {
  t.plan(16)
  let path = '/any-c/hello/there'
  tiny.get({
    url: url + path,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from any /any-c/*',
        resource: '/any-c/{proxy+}',
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: { proxy: 'hello/there' },
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /any-p/:param', t => {
  t.plan(16)
  let path = '/any-p/hello'
  tiny.get({
    url: url + path,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from any /any-p/:param',
        resource: '/any-p/{param}',
        path,
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        multiValueHeaders: '🤷🏽‍♀️',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: { param: 'hello' },
        body: null,
        isBase64Encoded: false,
      })
    }
  })
})

/**
 * Arc v8+: routes are now literal, no more greedy root (`any /{proxy+}`) fallthrough
 */
test('[HTTP v1.0 (REST) mode] post / - route should fail when not explicitly defined', t => {
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

test('[HTTP v1.0 (REST) mode] get /foobar - route should fail when not explicitly defined', t => {
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

test('[HTTP v1.0 (REST) mode] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Arc v6: test failing to load index.html without get / defined
 */
test('[HTTP v1.0 (REST) mode] Start Sandbox', t => {
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

test('[HTTP v1.0 (REST) mode] get / without defining get / should fail if index.html not present', t => {
  t.plan(1)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.equal(err.statusCode, 404, 'Got 404 for missing file')
    else t.fail(result)
  })
})

test('[HTTP v1.0 (REST) mode] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Arc v6: test successfully loading index.html without get / defined
 */
test('[HTTP v1.0 (REST) mode] Start Sandbox', t => {
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

test('[HTTP v1.0 (REST) mode] get / without defining get / should succeed if index.html is present', t => {
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

test('[HTTP v1.0 (REST) mode] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Test to ensure sandbox loads without defining @http
 */
test('[HTTP v1.0 (REST) mode] Start Sandbox', t => {
  t.plan(1)
  process.chdir(join(mock, 'no-http'))
  sandbox.start({ quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Sandbox successfully started', 'Sandbox started')
  })
})

test('[HTTP v1.0 (REST) mode] get / without defining @http', t => {
  t.plan(1)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.equal(err.code, 'ECONNREFUSED', 'Connection refused')
    else t.fail(result)
  })
})

test('[HTTP v1.0 (REST) mode] Teardown', t => {
  t.plan(3)
  shutdown(t)
  delete process.env.ARC_API_TYPE
  process.chdir(cwd)
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
