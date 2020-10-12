let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { url, shutdown } = require('./_utils')

let cwd = process.cwd()
let mock = join(__dirname, '..', '..', 'mock')
let data = { hi: 'there' }

test('Set up env', t => {
  t.plan(1)
  process.env.DEPRECATED = true
  t.ok(sandbox, 'got sandbox')
})

test('[REST mode / deprecated] Start Sandbox', t => {
  t.plan(4)
  process.chdir(join(mock, 'normal'))
  sandbox.start({}, function (err, result) {
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

test('[REST mode / deprecated] get /binary', t => {
  t.plan(3)
  tiny.get({
    url: url + '/binary'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      const img = Buffer.from(result.body).toString('base64')
      t.ok(result, 'got /binary')
      let { version } = result.headers
      t.notOk(version, 'No Lambda payload version specified')
      t.ok(img.includes('AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAA'), 'is binary')
    }
  })
})

test('[REST mode / deprecated] get /nodejs12.x', t => {
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

test('[REST mode / deprecated] get /nodejs10.x', t => {
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

test('[REST mode / deprecated] get /nodejs8.10', t => {
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

test('[REST mode / deprecated] get /python3.8', t => {
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

test('[REST mode / deprecated] get /python3.7', t => {
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

test('[REST mode / deprecated] get /python3.6', t => {
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

test('[REST mode / deprecated] get /ruby2.5', t => {
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

test('[REST mode / deprecated] get /deno', t => {
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

test('[REST mode / deprecated] get /no-return (noop)', t => {
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

test('[REST mode / deprecated] post /post', t => {
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
      // t.equal(b64dec(body), 'hi=there', 'Got base64-encoded form URL-encoded body payload')
      t.equal(JSON.stringify(body), JSON.stringify(data), 'Got base64-encoded form URL-encoded body payload')
      t.notOk(isBase64Encoded, 'No isBase64Encoded flag')
    }
  })
})

test('[REST mode / deprecated] put /put', t => {
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
      t.equal(JSON.stringify(body), JSON.stringify(data), 'Got base64-encoded JSON-serialized body payload')
      t.notOk(isBase64Encoded, 'No isBase64Encoded flag')
    }
  })
})

test('[REST mode / deprecated] patch /patch', t => {
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
      t.equal(JSON.stringify(body), JSON.stringify(data), 'Got base64-encoded JSON-serialized body payload')
      t.notOk(isBase64Encoded, 'No isBase64Encoded flag')
    }
  })
})

test('[REST mode / deprecated] delete /delete', t => {
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
      t.equal(JSON.stringify(body), JSON.stringify(data), 'Got base64-encoded JSON-serialized body payload')
      t.notOk(isBase64Encoded, 'No isBase64Encoded flag')
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
      t.ok(err.body.includes(message), `Errors with message instructing to add '${message}' handler`)
    }
    else t.fail(result)
  })
})

test('[REST mode / deprecated] get /foobar - route should fail when not explicitly defined', t => {
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

test('[REST mode / deprecated] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

/**
 * Arc v6: test failing to load index.html without get / defined
 */
test('[REST mode / deprecated] Start Sandbox', t => {
  t.plan(3)
  process.chdir(join(mock, 'no-index-fail'))
  sandbox.start({}, function (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(process.env.DEPRECATED, 'Arc v5 deprecated status set')
      t.equal(process.env.ARC_HTTP, 'aws', 'aws_proxy mode not enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[REST mode / deprecated] get / without defining get / should fail if index.html not present', t => {
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
 * Arc v6: test successfully loading index.html without get / defined
 */
test('[REST mode / deprecated] Start Sandbox', t => {
  t.plan(3)
  process.chdir(join(mock, 'no-index-pass'))
  sandbox.start({}, function (err, result) {
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
 * Test to ensure sandbox loads without defining @http
 */
test('[REST mode / deprecated] Start Sandbox', t => {
  t.plan(1)
  process.chdir(join(mock, 'no-http'))
  sandbox.start({}, function (err, result) {
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
  t.plan(4)
  shutdown(t)
  delete process.env.ARC_API_TYPE
  delete process.env.DEPRECATED
  process.chdir(cwd)
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
  t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
