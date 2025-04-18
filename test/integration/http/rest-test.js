let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { b64dec, checkRestResult: checkResult, data, isWindowsPythonStalling, rmPublic, run, shutdown, startup, url, verifyShutdown } = require('../../utils')

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got sandbox')
})

test('Run REST tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType) {
  let mode = `[REST mode / ${runType}]`

  test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'normal', { apigateway: 'rest' })
  })

  test(`${mode} get /`, t => {
    t.plan(17)
    tiny.get({
      url,
    }, function _got (err, result) {
      if (err) t.end(err)
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
          context: {
            awsRequestId: true, // Just check for presence
            functionName: 'sandbox-get-index',
            functionVersion: '$LATEST',
            invokedFunctionArn: 'sandbox',
            mem: 1152,
          },
        })
      }
    })
  })

  test(`${mode} get /?whats=up`, t => {
    t.plan(16)
    tiny.get({
      url: url + '/?whats=up',
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get / running the default runtime',
          resource: '/',
          path: '/',
          httpMethod: 'GET',
          headers: '🤷🏽‍♀️',
          multiValueHeaders: '🤷🏽‍♀️',
          queryStringParameters: { whats: 'up' },
          multiValueQueryStringParameters: { whats: [ 'up' ] },
          pathParameters: null,
          body: null,
          isBase64Encoded: false,
        })
      }
    })
  })

  test(`${mode} get /?whats=up&whats=there`, t => {
    t.plan(16)
    tiny.get({
      url: url + '/?whats=up&whats=there',
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get / running the default runtime',
          resource: '/',
          path: '/',
          httpMethod: 'GET',
          headers: '🤷🏽‍♀️',
          multiValueHeaders: '🤷🏽‍♀️',
          queryStringParameters: { whats: 'there' },
          multiValueQueryStringParameters: { whats: [ 'up', 'there' ] },
          pathParameters: null,
          body: null,
          isBase64Encoded: false,
        })
      }
    })
  })

  test(`${mode} get /binary`, t => {
    t.plan(17)
    let path = '/binary'
    tiny.get({
      url: url + path,
    }, function _got (err, result) {
      if (err) t.end(err)
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
        t.match(img, /AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAA/, 'is binary')
      }
    })
  })

  test(`${mode} get /nodejs22.x`, t => {
    t.plan(16)
    let path = '/nodejs22.x'
    tiny.get({
      url: url + path,
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /nodejs22.x (running nodejs22.x)',
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

  test(`${mode} get /nodejs20.x`, t => {
    t.plan(16)
    let path = '/nodejs20.x'
    tiny.get({
      url: url + path,
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /nodejs20.x (running nodejs20.x)',
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

  test(`${mode} get /nodejs18.x`, t => {
    t.plan(16)
    let path = '/nodejs18.x'
    tiny.get({
      url: url + path,
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /nodejs18.x (running nodejs18.x)',
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

  test(`${mode} get /python3.13`, t => {
    t.plan(17)
    let path = '/python3.13'
    tiny.get({
      url: url + path,
    }, function _got (err, result) {
      if (isWindowsPythonStalling(err, t)) return
      else if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /python3.13 (running python3.13)',
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
          context: {
            aws_request_id: true, // Just check for presence
            function_name: 'sandbox-get-python3_13',
            function_version: '$LATEST',
            invoked_function_arn: 'sandbox',
            memory_limit_in_mb: 1152,
          },
        })
      }
    })
  })

  test(`${mode} get /python3.9`, t => {
    t.plan(17)
    let path = '/python3.9'
    tiny.get({
      url: url + path,
    }, function _got (err, result) {
      if (isWindowsPythonStalling(err, t)) return
      else if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /python3.9 (running python3.9)',
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
          context: {
            aws_request_id: true, // Just check for presence
            function_name: 'sandbox-get-python3_9',
            function_version: '$LATEST',
            invoked_function_arn: 'sandbox',
            memory_limit_in_mb: 1152,
          },
        })
      }
    })
  })

  test(`${mode} get /ruby3.2`, t => {
    t.plan(17)
    let path = '/ruby3.2'
    tiny.get({
      url: url + path,
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /ruby3.2 (running ruby3.2)',
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
          context: {
            aws_request_id: true, // Just check for presence
            function_name: 'sandbox-get-ruby3_2',
            function_version: '$LATEST',
            invoked_function_arn: 'sandbox',
            memory_limit_in_mb: 1152,
          },
        })
      }
    })
  })

  test(`${mode} get /deno`, t => {
    t.plan(16)
    let path = '/deno'
    tiny.get({
      url: url + path,
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get /deno (running deno)',
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

  test(`${mode} get /no-return (noop)`, t => {
    t.plan(2)
    tiny.get({
      url: url + '/no-return',
    }, function _got (err, result) {
      if (err) {
        let message = 'No response found'
        t.equal(err.statusCode, 500, 'Errors with 500')
        t.match(err.body, new RegExp(message), `Errors with message: '${message}'`)
      }
      else t.end(result)
    })
  })

  test(`${mode} post /post`, t => {
    t.plan(16)
    let path = '/post'
    tiny.post({
      url: url + path,
      data,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, function _got (err, result) {
      if (err) t.end(err)
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
          // body: true,
          isBase64Encoded: true,
        })
        t.equal(b64dec(result.body.body), 'hi=there', 'Got base64-encoded form URL-encoded body payload')
      }
    })
  })

  test(`${mode} put /put`, t => {
    t.plan(16)
    let path = '/put'
    tiny.put({
      url: url + path,
      data,
    }, function _got (err, result) {
      if (err) t.end(err)
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

  test(`${mode} patch /patch`, t => {
    t.plan(16)
    let path = '/patch'
    tiny.patch({
      url: url + path,
      data,
    }, function _got (err, result) {
      if (err) t.end(err)
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

  test(`${mode} delete /delete`, t => {
    t.plan(16)
    let path = '/delete'
    tiny.del({
      url: url + path,
      data,
    }, function _got (err, result) {
      if (err) t.end(err)
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

  /**
   * Arc v6: greedy root (`any /{proxy+}`) fallthrough
   */
  test(`${mode} post / - route should fail when not explicitly defined, but only because 'any /{proxy+}' does not cover requests to root`, t => {
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
      else t.end(result)
    })
  })

  test(`${mode} get /foobar – route should fall through to greedy root`, t => {
    t.plan(16)
    let path = '/foobar'
    tiny.get({
      url: url + path,
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get / running the default runtime',
          resource: '/{proxy+}',
          path,
          httpMethod: 'GET',
          headers: '🤷🏽‍♀️',
          multiValueHeaders: '🤷🏽‍♀️',
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: { proxy: 'foobar' },
          body: null,
          isBase64Encoded: false,
        })
      }
    })
  })

  test(`${mode} get /path/* – route should fall through to greedy root because catchalls are not supported in this mode`, t => {
    t.plan(16)
    let path = '/path/hello/there'
    tiny.get({
      url: url + path,
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get / running the default runtime',
          resource: '/{proxy+}',
          path,
          httpMethod: 'GET',
          headers: '🤷🏽‍♀️',
          multiValueHeaders: '🤷🏽‍♀️',
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: { proxy: 'path/hello/there' },
          body: null,
          isBase64Encoded: false,
        })
      }
    })
  })

  test(`${mode} get /any – route should fall through to greedy root because 'any' is not supported in this mode`, t => {
    t.plan(16)
    let path = '/any'
    tiny.get({
      url: url + path,
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        checkResult(t, result.body, {
          message: 'Hello from get / running the default runtime',
          resource: '/{proxy+}',
          path,
          httpMethod: 'GET',
          headers: '🤷🏽‍♀️',
          multiValueHeaders: '🤷🏽‍♀️',
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: { proxy: 'any' },
          body: null,
          isBase64Encoded: false,
        })
      }
    })
  })

  test(`${mode} get /python-error should fail`, t => {
    t.plan(2)
    tiny.get({
      url: url + '/python-error',
    }, function _got (err) {
      if (isWindowsPythonStalling(err, t)) return
      else if (err) {
        t.equal(err.statusCode, 500, 'Got 500 for function error')
        t.match(err.body, /Hello from get \/python-error/, 'Got function error')
      }
      else {
        t.fail('request should have failed')
      }
    })
  })

  test(`${mode} get /ruby-error should fail`, t => {
    t.plan(2)
    tiny.get({
      url: url + '/ruby-error',
    }, function _got (err) {
      if (err) {
        t.equal(err.statusCode, 500, 'Got 500 for function error')
        t.match(err.body, /Hello from get \/ruby-error/, 'Got function error')
      }
      else {
        t.fail('request should have failed')
      }
    })
  })

  test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  /**
   * Arc v6: test failing to load index.html without get / defined
   */
  test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'no-index-fail')
  })

  test(`${mode} get / without defining get / should fail if index.html not present`, t => {
    t.plan(2)
    rmPublic(t)
    tiny.get({
      url,
    }, function _got (err, result) {
      if (err) t.equal(err.statusCode, 404, 'Got 404 for missing file')
      else t.end(result)
    })
  })

  test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  /**
   * Arc v6: test successfully loading index.html without get / defined
   */
  test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'no-index-pass')
  })

  test(`${mode} get / without defining get / should succeed if index.html is present`, t => {
    t.plan(2)
    tiny.get({
      url,
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        t.ok(result, 'got /')
        let { body } = result
        t.equal(body, 'Hello world!')
      }
    })
  })

  test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  /**
   * Arc v6: test failing to load an endpoint missing its local handler file
   */
  test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'missing-handler')
  })

  test(`${mode} get /missing should fail if missing its handler file`, t => {
    t.plan(2)
    tiny.get({
      url: url + '/missing',
    }, function _got (err, result) {
      if (err) {
        t.equal(err.statusCode, 502, 'Got 502 for missing file')
        t.match(err.body, /Lambda handler not found/, 'Got correct error')
      }
      else t.end(result)
    })
  })

  test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  /**
   * Test to ensure sandbox loads without defining @http
   */
  test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'no-http')
  })

  test(`${mode} get / without defining @http`, t => {
    t.plan(1)
    verifyShutdown(t, 'not actually shut down, just not using @http')
  })

  test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
