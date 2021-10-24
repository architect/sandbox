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
    startup[runType](t, 'route-order')
  })

  t.test(`${mode} get /`, t => {
    t.plan(16)
    tiny.get({
      url
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'hello get /',
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

  t.test(`${mode} get /first`, t => {
    t.plan(16)
    tiny.get({
      url: url + '/first'
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkResult(t, result.body, {
          message: 'hello get /first',
          routeKey: 'GET /first',
          rawPath: '/first',
          pathParameters: undefined,
          cookies: undefined,
          queryStringParameters: undefined,
          rawQueryString: '',
          headers: '🤷🏽‍♀️',
          isBase64Encoded: false,
          body: undefined,
          context: {
            awsRequestId: true, // Just check for presence
            functionName: 'sandbox-get-first',
            functionVersion: '$LATEST',
            invokedFunctionArn: 'sandbox',
            memoryLimitInMB: 1152,
          }
        })
      }
    })
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

}
