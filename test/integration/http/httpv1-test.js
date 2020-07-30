let path = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sandbox = require('../../../src')
let { http } = require('../../../src')
let { url, shutdown } = require('./_utils')

let cwd = process.cwd()
let b64dec = i => Buffer.from(i, 'base64').toString()

test('Set up env', t => {
  t.plan(2)
  process.env.ARC_API_TYPE = 'httpv1'
  t.ok(sandbox, 'got sandbox')
  t.ok(http, 'got http')
})

test('[HTTP v1.0 (REST) mode] Start Sandbox', t => {
  t.plan(3)
  process.chdir(path.join(__dirname, '..', '..', 'mock', 'normal'))
  sandbox.start({}, function (err) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.pass('Sandbox started')
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /', t => {
  t.plan(3)
  tiny.get({
    url
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from get / running the default runtime', 'Got correct handler response')
      console.log({ result })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /binary', t => {
  t.plan(3)
  tiny.get({
    url: url + '/binary'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      const img = Buffer.from(result.body).toString('base64')
      t.ok(result, 'got /binary')
      let { version } = result.headers
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.ok(img.includes('AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAA'), 'is binary')
      console.log({ result })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /nodejs12.x', t => {
  t.plan(3)
  tiny.get({
    url: url + '/nodejs12.x'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from get /nodejs12.x (running nodejs12.x)', 'Got correct handler response')
      console.log({ result })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /nodejs10.x', t => {
  t.plan(3)
  tiny.get({
    url: url + '/nodejs10.x'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from get /nodejs10.x (running nodejs10.x)', 'Got correct handler response')
      console.log({ result })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /nodejs8.10', t => {
  t.plan(3)
  tiny.get({
    url: url + '/nodejs8.10'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from get /nodejs8.10 (running nodejs8.10)', 'Got correct handler response')
      console.log({ result })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /python3.8', t => {
  t.plan(3)
  tiny.get({
    url: url + '/python3.8'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from get /python3.8 (running python3.8)', 'Got correct handler response')
      console.log({ result })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /python3.7', t => {
  t.plan(3)
  tiny.get({
    url: url + '/python3.7'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from get /python3.7 (running python3.7)', 'Got correct handler response')
      console.log({ result })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /python3.6', t => {
  t.plan(3)
  tiny.get({
    url: url + '/python3.6'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from get /python3.6 (running python3.6)', 'Got correct handler response')
      console.log({ result })
    }
  })
})

test('[HTTP v1.0 (REST) mode] get /ruby2.5', t => {
  t.plan(3)
  tiny.get({
    url: url + '/ruby2.5'
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got /')
      let { message, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from Architect Sandbox running ruby2.5!', 'Got correct handler response')
      console.log({ result })
    }
  })
})

test('[HTTP v1.0 (REST) mode] post /post', t => {
  t.plan(5)
  let data = { hi: 'there' }
  tiny.post({
    url: url + '/post',
    data,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'posted /post')
      let { body, message, isBase64Encoded, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from post /post', 'Got correct handler response')
      t.equal(b64dec(body), 'hi=there', 'Got base64-encoded form URL-encoded body payload')
      t.ok(isBase64Encoded, 'Got isBase64Encoded flag')
      console.log(body)
    }
  })
})

test('[HTTP v1.0 (REST) mode] put /put', t => {
  t.plan(5)
  let data = { hi: 'there' }
  tiny.put({
    url: url + '/put',
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'put /put')
      let { body, message, isBase64Encoded, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from put /put', 'Got correct handler response')
      t.equal(b64dec(body), JSON.stringify(data), 'Got base64-encoded form URL-encoded body payload')
      t.ok(isBase64Encoded, 'Got isBase64Encoded flag')
      console.log(body)
    }
  })
})

/**
 * Uncomment this when tiny supports patch :)
 */
/*
test('[HTTP v1.0 (REST) mode] patch /patch', t=> {
  t.plan(5)
  let data = {hi: 'there'}
  tiny.patch({
    url: url + '/patch',
    data,
  }, function _got(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'patched /patch')
      let { body, message, isBase64Encoded, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from patch /patch', 'Got correct handler response')
      t.equal(b64dec(body), JSON.stringify(data), 'Got base64-encoded form URL-encoded body payload')
      t.ok(isBase64Encoded, 'Got isBase64Encoded flag')
      console.log(body)
    }
  })
})
*/

test('[HTTP v1.0 (REST) mode] delete /delete', t => {
  t.plan(5)
  let data = { hi: 'there' }
  tiny.del({
    url: url + '/delete',
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'deleted /delete')
      let { body, message, isBase64Encoded, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from delete /delete', 'Got correct handler response')
      t.equal(b64dec(body), JSON.stringify(data), 'Got base64-encoded form URL-encoded body payload')
      t.ok(isBase64Encoded, 'Got isBase64Encoded flag')
      console.log(body)
    }
  })
})

test('[HTTP v1.0 (REST) mode] post / - non-get calls to root should hit $default when route is not explicitly defined', t => {
  t.plan(3)
  let data = { hi: 'there' }
  tiny.post({
    url,
    data,
  }, function _got (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'posted /')
      let { message, version } = result.body
      t.equal(version, '1.0', 'Got Lambda v1.0 payload')
      t.equal(message, 'Hello from get / running the default runtime', 'Got correct handler response')
      console.log({ result })
    }
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
  process.chdir(path.join(__dirname, '..', '..', 'mock', 'no-index-fail'))
  sandbox.start({}, function (err) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.pass('Sandbox started')
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
  process.chdir(path.join(__dirname, '..', '..', 'mock', 'no-index-pass'))
  sandbox.start({}, function (err) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.pass('Sandbox started')
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
      console.log(body)
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
  process.chdir(path.join(__dirname, '..', '..', 'mock', 'no-http'))
  sandbox.start({}, function (err) {
    if (err) t.fail(err)
    else {
      t.pass('Sandbox started')
    }
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
