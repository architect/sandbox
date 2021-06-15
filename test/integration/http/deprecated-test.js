let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { url, data, shutdown, checkDeprecatedResult: checkResult, rmPublic } = require('./_utils')

let mock = join(process.cwd(), 'test', 'mock')

test('Set up env', t => {
  t.plan(1)
  process.env.DEPRECATED = true
  t.ok(sandbox, 'got sandbox')
})

test('[REST mode / deprecated] Start Sandbox', t => {
  t.plan(4)
  sandbox.start({ cwd: join(mock, 'normal'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(process.env.DEPRECATED, 'Arc v5 deprecated status set')
      t.equal(process.env.ARC_API_TYPE, 'rest', 'API type set to rest')
      t.equal(process.env.ARC_HTTP, 'aws', 'aws_proxy mode not enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[REST mode / deprecated] get /', t => {
  t.plan(12)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get / running the default runtime',
        path: '/',
        method: 'GET',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: {},
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] get /?whats=up', t => {
  t.plan(12)
  tiny.get({
    url: url + '/?whats=up'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get / running the default runtime',
        path: '/',
        method: 'GET',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        query: { whats: 'up' },
        queryStringParameters: { whats: 'up' },
        params: {},
        body: {},
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] get /?whats=up&whats=there', t => {
  t.plan(12)
  tiny.get({
    url: url + '/?whats=up&whats=there'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get / running the default runtime',
        path: '/',
        method: 'GET',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        query: { whats: 'there' },
        queryStringParameters: { whats: 'there' },
        params: {},
        body: {},
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] get /binary', t => {
  t.plan(12)
  let path = '/binary'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, JSON.parse(result.headers.body), {
        message: 'Hello from get /binary',
        path,
        method: 'GET',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        isBase64Encoded: undefined,
      })
      const img = Buffer.from(result.body).toString('base64')
      t.match(img, /AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAA/, 'is binary')
    }
  })
})

test('[REST mode / deprecated] get /nodejs12.x', t => {
  t.plan(12)
  let path = '/nodejs12.x'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /nodejs12.x (running nodejs12.x)',
        path,
        method: 'GET',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: {},
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] get /nodejs10.x', t => {
  t.plan(12)
  let path = '/nodejs10.x'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /nodejs10.x (running nodejs10.x)',
        path,
        method: 'GET',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: {},
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] get /nodejs8.10', t => {
  t.plan(12)
  let path = '/nodejs8.10'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /nodejs8.10 (running nodejs8.10)',
        path,
        method: 'GET',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: {},
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] get /python3.8', t => {
  t.plan(12)
  let path = '/python3.8'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /python3.8 (running python3.8)',
        path,
        method: 'GET',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: {},
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] get /python3.7', t => {
  t.plan(12)
  let path = '/python3.7'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /python3.7 (running python3.7)',
        path,
        method: 'GET',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: {},
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] get /python3.6', t => {
  t.plan(12)
  let path = '/python3.6'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /python3.6 (running python3.6)',
        path,
        method: 'GET',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: {},
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] get /ruby2.5', t => {
  t.plan(12)
  let path = '/ruby2.5'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /ruby2.5 (running ruby2.5)',
        path,
        method: 'GET',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: {},
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] get /deno', t => {
  t.plan(12)
  let path = '/deno'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from get /deno (running deno)',
        path,
        method: 'GET',
        httpMethod: 'GET',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: {},
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] get /no-return (noop)', t => {
  t.plan(2)
  let path = '/no-return'
  tiny.get({
    url: url + path
  }, function _got (err, result) {
    if (err) {
      let message = 'Async error'
      t.equal(err.statusCode, 500, 'Errors with 500')
      t.match(err.body, new RegExp(message), `Errors with message: '${message}'`)
    }
    else t.fail(result)
  })
})

test('[REST mode / deprecated] post /post', t => {
  t.plan(12)
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
        path,
        method: 'POST',
        httpMethod: 'POST',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: data,
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] put /put', t => {
  t.plan(12)
  let path = '/put'
  tiny.put({
    url: url + path,
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from put /put',
        path,
        method: 'PUT',
        httpMethod: 'PUT',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: data,
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] patch /patch', t => {
  t.plan(12)
  let path = '/patch'
  tiny.patch({
    url: url + path,
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from patch /patch',
        path,
        method: 'PATCH',
        httpMethod: 'PATCH',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: data,
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] delete /delete', t => {
  t.plan(12)
  let path = '/delete'
  tiny.del({
    url: url + path,
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      checkResult(t, result.body, {
        message: 'Hello from delete /delete',
        path,
        method: 'DELETE',
        httpMethod: 'DELETE',
        headers: '🤷🏽‍♀️',
        query: {},
        queryStringParameters: {},
        params: {},
        body: data,
        isBase64Encoded: undefined,
      })
    }
  })
})

test('[REST mode / deprecated] post / - route should fail when not explicitly defined', t => {
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

test('[REST mode / deprecated] get /foobar - route should fail when not explicitly defined', t => {
  t.plan(2)
  tiny.get({
    url: url + '/foobar'
  }, function _got (err, result) {
    if (err) {
      let message = '@http get /foobar'
      t.equal(err.statusCode, 403, 'Errors with 403')
      t.match(err.body, new RegExp(message), `Errors with message instructing to add '${message}' handler`)
    }
    else t.fail(result)
  })
})

test('[REST mode / deprecated] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Arc v6: test failing to load index.html without get / defined
 */
test('[REST mode / deprecated] Start Sandbox', t => {
  t.plan(3)
  sandbox.start({ cwd: join(mock, 'no-index-fail'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(process.env.DEPRECATED, 'Arc v5 deprecated status set')
      t.equal(process.env.ARC_HTTP, 'aws', 'aws_proxy mode not enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[REST mode / deprecated] get / without defining get / should fail if index.html not present', t => {
  t.plan(2)
  rmPublic(t)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.equal(err.statusCode, 403, 'Got 403 for missing file')
    else t.fail(result)
  })
})

test('[REST mode / deprecated] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Arc v6: test successfully loading index.html without get / defined
 */
test('[REST mode / deprecated] Start Sandbox', t => {
  t.plan(3)
  sandbox.start({ cwd: join(mock, 'no-index-pass'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(process.env.DEPRECATED, 'Arc v5 deprecated status set')
      t.equal(process.env.ARC_HTTP, 'aws', 'aws_proxy mode not enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[REST mode / deprecated] get / without defining get / should fail if index.html is present', t => {
  t.plan(1)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.equal(err.statusCode, 403, 'Got 403 for missing file')
    else t.fail(result)
  })
})

test('[REST mode / deprecated] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Test failing to load an endpoint missing its local handler file
 */
test('[REST mode / deprecated] Start Sandbox', t => {
  t.plan(3)
  sandbox.start({ cwd: join(mock, 'missing-handler'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(process.env.DEPRECATED, 'Arc v5 deprecated status set')
      t.equal(process.env.ARC_HTTP, 'aws', 'aws_proxy mode not enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[REST mode / deprecated] get /missing should fail if missing its handler file', t => {
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

test('[REST mode / deprecated] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Test to ensure sandbox loads without defining @http
 */
test('[REST mode / deprecated] Start Sandbox', t => {
  t.plan(1)
  sandbox.start({ cwd: join(mock, 'no-http'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Sandbox successfully started', 'Sandbox started')
  })
})

test('[REST mode / deprecated] get / without defining @http', t => {
  t.plan(1)
  tiny.get({ url },
    function _got (err, result) {
      if (err) t.equal(err.code, 'ECONNREFUSED', 'Connection refused')
      else t.fail(result)
    })
})

test('[REST mode / deprecated] Teardown', t => {
  t.plan(3)
  shutdown(t)
  delete process.env.ARC_API_TYPE
  delete process.env.DEPRECATED
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
  t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
})
