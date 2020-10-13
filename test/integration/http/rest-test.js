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

test('Set up env', t => {
  t.plan(1)
  process.env.ARC_API_TYPE = 'rest'
  t.ok(sandbox, 'got sandbox')
})

test('[REST mode] Start Sandbox', t => {
  t.plan(4)
  process.chdir(join(mock, 'normal'))
  sandbox.start({ quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'rest', 'API type set to rest')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[REST mode] get /', t => {
  t.plan(3)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from get / running the default runtime', 'Got correct handler response')
    }
  })
})

test('[REST mode] get /binary', t => {
  t.plan(3)
  tiny.get({
    url: url + '/binary'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      const img = Buffer.from(result.body).toString('base64')
      t.ok(result, 'got /binary')
      let { version } = JSON.parse(result.headers.body)
      t.notOk(version, 'No Lambda payload version specified')
      t.ok(img.includes('AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAA'), 'is binary')
    }
  })
})

test('[REST mode] get /nodejs12.x', t => {
  t.plan(3)
  tiny.get({
    url: url + '/nodejs12.x'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /nodejs12.x')
      let { message, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from get /nodejs12.x (running nodejs12.x)', 'Got correct handler response')
    }
  })
})

test('[REST mode] get /nodejs10.x', t => {
  t.plan(3)
  tiny.get({
    url: url + '/nodejs10.x'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /nodejs10.x')
      let { message, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from get /nodejs10.x (running nodejs10.x)', 'Got correct handler response')
    }
  })
})

test('[REST mode] get /nodejs8.10', t => {
  t.plan(3)
  tiny.get({
    url: url + '/nodejs8.10'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /nodejs8.10')
      let { message, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from get /nodejs8.10 (running nodejs8.10)', 'Got correct handler response')
    }
  })
})

test('[REST mode] get /python3.8', t => {
  t.plan(3)
  tiny.get({
    url: url + '/python3.8'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /python3.8')
      let { message, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from get /python3.8 (running python3.8)', 'Got correct handler response')
    }
  })
})

test('[REST mode] get /python3.7', t => {
  t.plan(3)
  tiny.get({
    url: url + '/python3.7'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /python3.7')
      let { message, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from get /python3.7 (running python3.7)', 'Got correct handler response')
    }
  })
})

test('[REST mode] get /python3.6', t => {
  t.plan(3)
  tiny.get({
    url: url + '/python3.6'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /python3.6')
      let { message, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from get /python3.6 (running python3.6)', 'Got correct handler response')
    }
  })
})

test('[REST mode] get /ruby2.5', t => {
  t.plan(3)
  tiny.get({
    url: url + '/ruby2.5'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /ruby2.5')
      let { message, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from Architect Sandbox running ruby2.5!', 'Got correct handler response')
    }
  })
})

test('[REST mode] get /deno', t => {
  t.plan(3)
  tiny.get({
    url: url + '/deno'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /deno')
      let { message, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from Architect Sandbox running deno!', 'Got correct handler response')
    }
  })
})

test('[REST mode] get /no-return (noop)', t => {
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

test('[REST mode] post /post', t => {
  t.plan(5)
  tiny.post({
    url: url + '/post',
    data,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'posted /post')
      let { body, message, isBase64Encoded, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from post /post', 'Got correct handler response')
      t.equal(b64dec(body), 'hi=there', 'Got base64-encoded form URL-encoded body payload')
      t.ok(isBase64Encoded, 'Got isBase64Encoded flag')
    }
  })
})

test('[REST mode] put /put', t => {
  t.plan(5)
  tiny.put({
    url: url + '/put',
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'put /put')
      let { body, message, isBase64Encoded, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from put /put', 'Got correct handler response')
      t.equal(b64dec(body), JSON.stringify(data), 'Got base64-encoded form URL-encoded body payload')
      t.ok(isBase64Encoded, 'Got isBase64Encoded flag')
    }
  })
})

test('[REST mode] patch /patch', t => {
  t.plan(5)
  tiny.patch({
    url: url + '/patch',
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'patched /patch')
      let { body, message, isBase64Encoded, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from patch /patch', 'Got correct handler response')
      t.equal(b64dec(body), JSON.stringify(data), 'Got base64-encoded form URL-encoded body payload')
      t.ok(isBase64Encoded, 'Got isBase64Encoded flag')
    }
  })
})

test('[REST mode] delete /delete', t => {
  t.plan(5)
  tiny.del({
    url: url + '/delete',
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'deleted /delete')
      let { body, message, isBase64Encoded, version } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from delete /delete', 'Got correct handler response')
      t.equal(b64dec(body), JSON.stringify(data), 'Got base64-encoded form URL-encoded body payload')
      t.ok(isBase64Encoded, 'Got isBase64Encoded flag')
    }
  })
})


/**
 * Arc v6: greedy root (`any /{proxy+}`) fallthrough
 */
test('[REST mode] post / - route should fail when not explicitly defined, but only because `any /{proxy+}` does not cover requests to root', t => {
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

test('[REST mode] get /foobar – route should fall through to greedy root', t => {
  t.plan(8)
  tiny.get({
    url: url + '/foobar',
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version, resource, path, pathParameters, requestContext } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from get / running the default runtime', 'Got correct handler response')
      t.equal(resource, '/{proxy+}', 'Got correct resource param')
      t.equal(path, '/foobar', 'Got correct path param')
      t.equal(pathParameters.proxy, 'foobar', 'Got correct pathParameters.proxy')
      t.equal(requestContext.path, '/foobar', 'Got correct requestContext.path param')
      t.equal(requestContext.resourcePath, '/{proxy+}', 'Got correct requestContext.resourcePath param')
    }
  })
})

test('[REST mode] get /path/* – route should fall through to greedy root because catchalls are not supported in this mode', t => {
  t.plan(8)
  tiny.get({
    url: url + '/path/hello/there'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version, resource, path, pathParameters, requestContext } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from get / running the default runtime', 'Got correct handler response')
      t.equal(resource, '/{proxy+}', 'Got correct resource param')
      t.equal(path, '/path/hello/there', 'Got correct path param')
      t.equal(pathParameters.proxy, 'path/hello/there', 'Got correct pathParameters.proxy')
      t.equal(requestContext.path, '/path/hello/there', 'Got correct requestContext.path param')
      t.equal(requestContext.resourcePath, '/{proxy+}', 'Got correct requestContext.resourcePath param')
    }
  })
})

test(`[REST mode] get /any – route should fall through to greedy root because 'any' is not supported in this mode`, t => {
  t.plan(8)
  tiny.get({
    url: url + '/any'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version, resource, path, pathParameters, requestContext } = result.body
      t.notOk(version, 'No Lambda payload version specified')
      t.equal(message, 'Hello from get / running the default runtime', 'Got correct handler response')
      t.equal(resource, '/{proxy+}', 'Got correct resource param')
      t.equal(path, '/any', 'Got correct path param')
      t.equal(pathParameters.proxy, 'any', 'Got correct pathParameters.proxy')
      t.equal(requestContext.path, '/any', 'Got correct requestContext.path param')
      t.equal(requestContext.resourcePath, '/{proxy+}', 'Got correct requestContext.resourcePath param')
    }
  })
})

test('[REST mode] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Arc v6: test failing to load index.html without get / defined
 */
test('[REST mode] Start Sandbox', t => {
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

test('[REST mode] get / without defining get / should fail if index.html not present', t => {
  t.plan(1)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.equal(err.statusCode, 404, 'Got 404 for missing file')
    else t.fail(result)
  })
})

test('[REST mode] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Arc v6: test successfully loading index.html without get / defined
 */
test('[REST mode] Start Sandbox', t => {
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

test('[REST mode] get / without defining get / should succeed if index.html is present', t => {
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

test('[REST mode] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Test to ensure sandbox loads without defining @http
 */
test('[REST mode] Start Sandbox', t => {
  t.plan(1)
  process.chdir(join(mock, 'no-http'))
  sandbox.start({ quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[REST mode] get / without defining @http', t => {
  t.plan(1)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.equal(err.code, 'ECONNREFUSED', 'Connection refused')
    else t.fail(result)
  })
})

test('[REST mode] Teardown', t => {
  t.plan(3)
  shutdown(t)
  delete process.env.ARC_API_TYPE
  process.chdir(cwd)
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
