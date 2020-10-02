let path = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sandbox = require('../../../src')
let { url, shutdown } = require('./_utils')

let cwd = process.cwd()
let b64dec = i => Buffer.from(i, 'base64').toString()
let data = { hi: 'there' }

test('Set up env', t => {
  t.plan(1)
  process.env.ARC_API_TYPE = 'http'
  t.ok(sandbox, 'got sandbox')
})

test('[HTTP mode] Start Sandbox', t => {
  t.plan(4)
  process.chdir(path.join(__dirname, '..', '..', 'mock', 'normal'))
  sandbox.start({}, function (err, result) {
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
  t.plan(3)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from get / running the default runtime', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] get /binary', t => {
  t.plan(3)
  tiny.get({
    url: url + '/binary'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      const img = Buffer.from(result.body).toString('base64')
      t.ok(result, 'got /binary')
      let { version } = result.headers
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.ok(img.includes('AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAA'), 'is binary')
    }
  })
})

test('[HTTP mode] get /nodejs12.x', t => {
  t.plan(3)
  tiny.get({
    url: url + '/nodejs12.x'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /nodejs12.x')
      let { message, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from get /nodejs12.x (running nodejs12.x)', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] get /nodejs10.x', t => {
  t.plan(3)
  tiny.get({
    url: url + '/nodejs10.x'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /nodejs10.x')
      let { message, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from get /nodejs10.x (running nodejs10.x)', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] get /nodejs8.10', t => {
  t.plan(3)
  tiny.get({
    url: url + '/nodejs8.10'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /nodejs8.10')
      let { message, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from get /nodejs8.10 (running nodejs8.10)', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] get /python3.8', t => {
  t.plan(3)
  tiny.get({
    url: url + '/python3.8'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /python3.8')
      let { message, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from get /python3.8 (running python3.8)', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] get /python3.7', t => {
  t.plan(3)
  tiny.get({
    url: url + '/python3.7'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /python3.7')
      let { message, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from get /python3.7 (running python3.7)', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] get /python3.6', t => {
  t.plan(3)
  tiny.get({
    url: url + '/python3.6'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /python3.6')
      let { message, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from get /python3.6 (running python3.6)', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] get /ruby2.5', t => {
  t.plan(3)
  tiny.get({
    url: url + '/ruby2.5'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /ruby2.5')
      let { message, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from Architect Sandbox running ruby2.5!', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] get /deno', t => {
  t.plan(3)
  tiny.get({
    url: url + '/deno'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /deno')
      let { message, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from Architect Sandbox running deno!', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] get /path/*', t => {
  t.plan(3)
  tiny.get({
    url: url + '/path/hello/there'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /path/*')
      let { message, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from get /path/* running the default runtime')
    }
  })
})

test('[HTTP mode] get /no-return (noop)', t => {
  t.plan(3)
  tiny.get({
    url: url + '/no-return'
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
  t.plan(5)
  tiny.post({
    url: url + '/post',
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'posted /post')
      let { body, message, isBase64Encoded, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from post /post', 'Got correct handler response')
      t.equal(body, JSON.stringify(data), 'Got JSON-serialized body payload')
      t.equal(isBase64Encoded, false, 'Got isBase64Encoded flag')
    }
  })
})

test('[HTTP mode] post /post (flavored JSON)', t => {
  t.plan(5)
  tiny.post({
    url: url + '/post',
    data,
    headers: { 'Content-Type': 'application/ld+json' }, // Exercise the JSON regex
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'posted /post')
      let { body, message, isBase64Encoded, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from post /post', 'Got correct handler response')
      t.equal(body, JSON.stringify(data), 'Got JSON-serialized body payload')
      t.equal(isBase64Encoded, false, 'Got isBase64Encoded flag')
    }
  })
})

test('[HTTP mode] put /put', t => {
  t.plan(5)
  tiny.put({
    url: url + '/put',
    data,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'put /put')
      let { body, message, isBase64Encoded, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from put /put', 'Got correct handler response')
      t.equal(b64dec(body), 'hi=there', 'Got base64-encoded form URL-encoded body payload')
      t.ok(isBase64Encoded, 'Got isBase64Encoded flag')
    }
  })
})

test('[HTTP mode] patch /patch', t => {
  t.plan(5)
  tiny.patch({
    url: url + '/patch',
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'patched /patch')
      let { body, message, isBase64Encoded, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from patch /patch', 'Got correct handler response')
      t.equal(body, JSON.stringify(data), 'Got JSON-serialized body payload')
      t.equal(isBase64Encoded, false, 'Got isBase64Encoded flag')
    }
  })
})

test('[HTTP mode] delete /delete', t => {
  t.plan(5)
  tiny.del({
    url: url + '/delete',
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'deleted /delete')
      let { body, message, isBase64Encoded, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from delete /delete', 'Got correct handler response')
      t.equal(body, JSON.stringify(data), 'Got JSON-serialized body payload')
      t.equal(isBase64Encoded, false, 'Got isBase64Encoded flag')
    }
  })
})

test('[HTTP mode] head /head', t => {
  t.plan(3)
  tiny.head({
    url: url + '/head'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'headed /head')
      let { message, version } = JSON.parse(result.headers.body)
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from head /head', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] options /options', t => {
  t.plan(3)
  tiny.options({
    url: url + '/options'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'optioned /options')
      let { message, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from options /options', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] get /any', t => {
  t.plan(5)
  tiny.get({
    url: url + '/any',
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /any')
      let { message, version, routeKey, requestContext } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(routeKey, 'ANY /any', 'Got correct routeKey')
      t.equal(requestContext.http.method, 'GET', 'Got correct method')
      t.equal(message, 'Hello from any /any', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] post /any', t => {
  t.plan(7)
  tiny.post({
    url: url + '/any',
    data,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'posted /any')
      let { body, message, isBase64Encoded, version, routeKey, requestContext } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(routeKey, 'ANY /any', 'Got correct routeKey')
      t.equal(requestContext.http.method, 'POST', 'Got correct method')
      t.equal(message, 'Hello from any /any', 'Got correct handler response')
      t.equal(b64dec(body), 'hi=there', 'Got base64-encoded form URL-encoded body payload')
      t.ok(isBase64Encoded, 'Got isBase64Encoded flag')
    }
  })
})

test('[HTTP mode] put /any', t => {
  t.plan(7)
  tiny.put({
    url: url + '/any',
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'put /any')
      let { body, message, isBase64Encoded, version, routeKey, requestContext } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(routeKey, 'ANY /any', 'Got correct routeKey')
      t.equal(requestContext.http.method, 'PUT', 'Got correct method')
      t.equal(message, 'Hello from any /any', 'Got correct handler response')
      t.equal(body, JSON.stringify(data), 'Got JSON-serialized body payload')
      t.equal(isBase64Encoded, false, 'Got isBase64Encoded flag')
    }
  })
})

test('[HTTP mode] patch /any', t => {
  t.plan(7)
  tiny.patch({
    url: url + '/any',
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'patched /any')
      let { body, message, isBase64Encoded, version, routeKey, requestContext } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(routeKey, 'ANY /any', 'Got correct routeKey')
      t.equal(requestContext.http.method, 'PATCH', 'Got correct method')
      t.equal(message, 'Hello from any /any', 'Got correct handler response')
      t.equal(body, JSON.stringify(data), 'Got JSON-serialized body payload')
      t.equal(isBase64Encoded, false, 'Got isBase64Encoded flag')
    }
  })
})

test('[HTTP mode] delete /any', t => {
  t.plan(7)
  tiny.del({
    url: url + '/any',
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'deleted /any')
      let { body, message, isBase64Encoded, version, routeKey, requestContext } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(routeKey, 'ANY /any', 'Got correct routeKey')
      t.equal(requestContext.http.method, 'DELETE', 'Got correct method')
      t.equal(message, 'Hello from any /any', 'Got correct handler response')
      t.equal(body, JSON.stringify(data), 'Got JSON-serialized body payload')
      t.equal(isBase64Encoded, false, 'Got isBase64Encoded flag')
    }
  })
})

test('[HTTP mode] head /any', t => {
  t.plan(5)
  tiny.head({
    url: url + '/any',
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'headed /any')
      let { message, version, routeKey, requestContext } = JSON.parse(result.headers.body)
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(routeKey, 'ANY /any', 'Got correct routeKey')
      t.equal(requestContext.http.method, 'HEAD', 'Got correct method')
      t.equal(message, 'Hello from any /any', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] options /any', t => {
  t.plan(5)
  tiny.options({
    url: url + '/any',
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'optioned /any')
      let { message, version, routeKey, requestContext } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(routeKey, 'ANY /any', 'Got correct routeKey')
      t.equal(requestContext.http.method, 'OPTIONS', 'Got correct method')
      t.equal(message, 'Hello from any /any', 'Got correct handler response')
    }
  })
})

test('[HTTP mode] post / – non-get calls to root should hit $default when route is not explicitly defined', t => {
  t.plan(5)
  tiny.post({
    url,
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'posted /')
      let { body, message, isBase64Encoded, version } = result.body
      t.equal(version, '2.0', 'Got Lambda v2.0 payload')
      t.equal(message, 'Hello from get / running the default runtime', 'Got correct handler response')
      t.equal(body, JSON.stringify(data), 'Got JSON-serialized body payload')
      t.equal(isBase64Encoded, false, 'Got isBase64Encoded flag')
    }
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
  process.chdir(path.join(__dirname, '..', '..', 'mock', 'no-index-fail'))
  sandbox.start({}, function (err, result) {
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
  process.chdir(path.join(__dirname, '..', '..', 'mock', 'no-index-pass'))
  sandbox.start({}, function (err, result) {
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
  process.chdir(path.join(__dirname, '..', '..', 'mock', 'no-http'))
  sandbox.start({}, function (err, result) {
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
