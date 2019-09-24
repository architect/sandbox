let path = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sandbox = require('../../src')
let {http} = require('../../src')

let b64dec = i => Buffer.from(i, 'base64').toString()
let url = 'http://localhost:6666'

let client
test('env', t=> {
  t.plan(2)
  t.ok(sandbox, 'got sandbox')
  t.ok(http, 'got http')
})

/**
 * Test sandbox http in isolation
 */
test('http.start', t=> {
  t.plan(2)
  // move to test/mock
  process.chdir(path.join(__dirname, '..', 'mock', 'normal'))
  client = http.start(function() {
    t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
    t.ok(client, '@http mounted')
  })
})

test('get /', t=> {
  t.plan(2)
  tiny.get({url},
  function _got(err, data) {
    if (err) t.fail(err)
    else {
      t.ok(data, 'got /')
      t.ok(data.body.startsWith('Hello from Architect Sandbox running nodejs10.x!'), 'is hello world')
      console.log({data})
    }
  })
})

test('get /binary', t=> {
  t.plan(2)
  tiny.get({
    url: url + '/binary'
  }, function _got(err, data) {
    if (err) t.fail(err)
    else {
      const img = Buffer.from(data.body).toString('base64');
      t.ok(data, 'got /binary')
      t.ok(img.startsWith('AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAA'), 'is binary')
      console.log({data})
    }
  })
})

test('get /nodejs8.10', t=> {
  t.plan(2)
  tiny.get({
    url: url + '/nodejs8.10'
  }, function _got(err, data) {
    if (err) t.fail(err)
    else {
      t.ok(data, 'got /')
      t.ok(data.body.startsWith('Hello from Architect Sandbox running nodejs8.10!'), 'is hello world')
      console.log({data})
    }
  })
})

test('get /python3.7', t=> {
  t.plan(2)
  tiny.get({
    url: url + '/python3.7'
  }, function _got(err, data) {
    if (err) t.fail(err)
    else {
      t.ok(data, 'got /')
      t.ok(data.body.startsWith('Hello from Architect Sandbox running python3.7!'), 'is hello world')
      console.log({data})
    }
  })
})

test('get /python3.6', t=> {
  t.plan(2)
  tiny.get({
    url: url + '/python3.6'
  }, function _got(err, data) {
    if (err) t.fail(err)
    else {
      t.ok(data, 'got /')
      t.ok(data.body.startsWith('Hello from Architect Sandbox running python3.6!'), 'is hello world')
      console.log({data})
    }
  })
})

test('get /ruby2.5', t=> {
  t.plan(2)
  tiny.get({
    url: url + '/ruby2.5'
  }, function _got(err, data) {
    if (err) t.fail(err)
    else {
      t.ok(data, 'got /')
      t.ok(data.body.startsWith('Hello from Architect Sandbox running ruby2.5!'), 'is hello world')
      console.log({data})
    }
  })
})

test('post /post', t=> {
  t.plan(3)
  let data = {hi: 'there'}
  tiny.post({
    url: url + '/post',
    data,
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  }, function _got(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'posted /post')
      t.equal(b64dec(result.body.body), 'hi=there', 'Got base64-encoded form URL-encoded body payload')
      t.ok(result.body.isBase64Encoded, 'Got isBase64Encoded flag')
      console.log(result.body)
    }
  })
})

test('put /put', t=> {
  t.plan(3)
  let data = {hi: 'there'}
  tiny.put({
    url: url + '/put',
    data,
  }, function _got(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'put /put')
      t.equal(b64dec(result.body.body), JSON.stringify(data), 'Got base64-encoded JSON-encoded body payload')
      t.ok(result.body.isBase64Encoded, 'Got isBase64Encoded flag')
      console.log(result.body)
    }
  })
})

/**
 * Uncomment this when tiny supports patch :)
 */
/*
test('patch /patch', t=> {
  t.plan(3)
  let data = {hi: 'there'}
  tiny.patch({
    url: url + '/patch',
    data,
  }, function _got(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'patched /patch')
      t.equal(b64dec(result.body.body), JSON.stringify(data), 'Got base64-encoded JSON-encoded body payload')
      t.ok(result.body.isBase64Encoded, 'Got isBase64Encoded flag')
      console.log(result.body)
    }
  })
})
*/

test('delete /delete', t=> {
  t.plan(3)
  let data = {hi: 'there'}
  tiny.del({
    url: url + '/delete',
    data,
  }, function _got(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'deleted /delete')
      t.equal(b64dec(result.body.body), JSON.stringify(data), 'Got base64-encoded JSON-encoded body payload')
      t.ok(result.body.isBase64Encoded, 'Got isBase64Encoded flag')
      console.log(result.body)
    }
  })
})

test('http.close', t=> {
  t.plan(1)
  client.close()
  t.pass('http connection closed')
})

/**
 * Arc v6: test failing to load index.html without get / defined
 */
let end
test('sandbox.start', t=> {
  t.plan(3)
  process.chdir(path.join(__dirname, '..', 'mock', 'no-index-fail'))
  sandbox.start({}, function(err, close) {
    if (err) t.fail(err)
    else {
      end = close
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.ok(end, 'sandbox started')
    }
  })
})

test('get / without defining get / should fail if index.html not present', t=> {
  t.plan(1)
  tiny.get({url},
  function _got(err, data) {
    if (err) {
      t.equals(err.statusCode, 502, 'Got 502 for missing function')
    }
    else {
      t.ok(data, 'proxy mounted')
      console.log(data)
    }
  })
})

test('shut down sandbox', t=> {
  t.plan(1)
  end()
  t.pass('sandbox shut down')
})

/**
 * Arc v6: test successfully loading index.html without get / defined
 */
test('sandbox.start', t=> {
  t.plan(3)
  process.chdir(path.join(__dirname, '..', 'mock', 'no-index-pass'))
  sandbox.start({}, function(err, close) {
    if (err) t.fail(err)
    else {
      end = close
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.ok(end, 'sandbox started')
    }
  })
})

test('get / without defining get / should succeed if index.html is present', t=> {
  t.plan(1)
  tiny.get({url},
  function _got(err, data) {
    if (err) t.fail('Should not have received error')
    else {
      t.ok(data.body.startsWith('Hello world!'), 'Proxy mounted and delivered index.html')
      console.log(data)
    }
  })
})

test('shut down sandbox', t=> {
  t.plan(1)
  end()
  t.pass('sandbox shut down')
})

/**
 * Test to ensure sandbox loads without defining @http
 */
test('sandbox.start', t=> {
  t.plan(1)
  process.chdir(path.join(__dirname, '..', 'mock', 'no-http'))
  sandbox.start({}, function(err, close) {
    if (err) t.fail(err)
    else {
      end = close
      t.ok(end, 'sandbox started')
    }
  })
})

test('get / without defining @http', t=> {
  t.plan(1)
  tiny.get({url},
  function _got(err, data) {
    if (err) {
      t.equals(err.code, 'ECONNREFUSED', 'Connection refused')
    }
    else t.fail(data)
  })
})

test('shut down sandbox', t=> {
  t.plan(1)
  end()
  t.pass('sandbox shut down')
})

/**
 * Arc 5 compatibility tests
 */
test('sandbox.start', t=> {
  t.plan(2)
  process.chdir(path.join(__dirname, '..', 'mock', 'normal'))
  sandbox.start({version: 'Architect 5.x'}, function(err, close) {
    if (err) t.fail(err)
    else {
      end = close
      t.ok(process.env.DEPRECATED, 'Arc v5 deprecated status set')
      t.ok(end, 'sandbox started')
    }
  })
})

test('get /', t=> {
  t.plan(2)
  tiny.get({url},
  function _got(err, data) {
    if (err) t.fail(err)
    else {
      t.ok(data, 'got /')
      t.ok(data.body.startsWith('Hello from Architect Sandbox running nodejs10.x!'), 'is hello world')
      console.log({data})
    }
  })
})

test('get /binary', t=> {
  t.plan(2)
  tiny.get({
    url: url + '/binary'
  }, function _got(err, data) {
    if (err) t.fail(err)
    else {
      const img = Buffer.from(data.body).toString('base64');
      t.ok(data, 'got /binary')
      t.ok(img.startsWith('AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAA'), 'is binary')
      console.log({data})
    }
  })
})

test('post /post', t=> {
  t.plan(3)
  let data = {hi: 'there'}
  tiny.post({
    url: url + '/post',
    data,
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  }, function _got(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'posted /post')
      t.equal(JSON.stringify(result.body.body), JSON.stringify(data), 'Got base64-encoded form URL-encoded body payload')
      t.notOk(result.body.isBase64Encoded, 'No isBase64Encoded flag')
      console.log(result.body)
      t.end()
    }
  })
})

test('put /put', t=> {
  t.plan(3)
  let data = {hi: 'there'}
  tiny.put({
    url: url + '/put',
    data,
  }, function _got(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'put /put')
      t.equal(JSON.stringify(result.body.body), JSON.stringify(data), 'Got base64-encoded JSON-encoded body payload')
      t.notOk(result.body.isBase64Encoded, 'No isBase64Encoded flag')
      console.log(result.body)
      t.end()
    }
  })
})

/**
 * Uncomment this when tiny supports patch :)
 */
/*
test('patch /patch', t=> {
  t.plan(3)
  let data = {hi: 'there'}
  tiny.patch({
    url: url + '/patch',
    data,
  }, function _got(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'patched /patch')
      t.equal(JSON.stringify(result.body.body), JSON.stringify(data), 'Got base64-encoded JSON-encoded body payload')
      t.notOk(result.body.isBase64Encoded, 'No isBase64Encoded flag')
      console.log(result.body)
      t.end()
    }
  })
})
*/

test('delete /delete', t=> {
  t.plan(3)
  let data = {hi: 'there'}
  tiny.del({
    url: url + '/delete',
    data,
  }, function _got(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'deleted /delete')
      t.equal(JSON.stringify(result.body.body), JSON.stringify(data), 'Got base64-encoded JSON-encoded body payload')
      t.notOk(result.body.isBase64Encoded, 'No isBase64Encoded flag')
      console.log(result.body)
      t.end()
    }
  })
})

test('shut down sandbox', t=> {
  t.plan(1)
  end()
  t.pass('sandbox shut down')
})
