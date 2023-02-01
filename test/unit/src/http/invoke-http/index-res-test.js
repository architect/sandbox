let test = require('tape')
let sinon = require('sinon')
let proxyquire = require('proxyquire')
let lambdaStub = sinon.stub().yields()
let { join } = require('path')
let sut = join(process.cwd(), 'src', 'http', 'invoke-http')
let invoke = proxyquire(sut, {
  '../../invoke-lambda': lambdaStub
})
let { arc7, arc6 } = require('@architect/req-res-fixtures').http.res
let { url } = require(join(process.cwd(), 'test', 'utils'))

let b64dec = i => Buffer.from(i, 'base64').toString()
let b64enc = i => Buffer.from(i).toString('base64')
let str = i => JSON.stringify(i)
let match = (copy, item) => `${copy} matches: ${item}`
let inventory = { inv: { _project: { preferences: null } } }
let json = 'application/json'
let utf8 = '; charset=utf-8'
let jsonUtf8 = json + utf8
let htmlUtf8 = `text/html${utf8};`
let textUtf8 = `text/plain${utf8}`
// Used for checking Sandbox mutation of SSL → local cookies
let localCookie = 'hi=there; Path=/'
// Test invocation errors
let returnError = false

// Reconstructs response from Sinon stub
function parseOutput (output) {
  let res = {
    body: output.end.args[0][0],
    headers: {}
  }
  output.setHeader.args.forEach(arg => {
    let key = arg[0]
    let value = arg[1]
    res.headers[key] = value
  })
  if (output.statusCode) res.statusCode = output.statusCode
  if (output.isBase64Encoded) res.isBase64Encoded = output.isBase64Encoded
  return res
}

// Assembles response invokation for each test block
function getInvoker (params, response, callback) {
  // Generic input (shouldn't impact tests)
  let input = {
    url,
    body: {},
    headers: { 'Accept-Encoding': 'gzip' },
    params: {}
  }
  // Mocked res object
  let output = {
    getHeaders: () => ({ 'content-type': 'application/json; charset=utf-8' }),
    statusCode: sinon.fake.returns(),
    setHeader: sinon.fake.returns(),
    end: sinon.fake.returns()
  }
  // Path for returning an invocation error
  if (returnError) lambdaStub.yields(returnError)
  else lambdaStub.yields(null, response)

  let handler = invoke(params)
  handler(input, output)
  let res = parseOutput(output)
  callback(res)
}
function teardown () {
  lambdaStub.reset() // mostly jic
  returnError = false
}

test('Unknown invocation error', t => {
  t.plan(2)
  let lambda = { method: 'GET', route: '/' }
  let params = { lambda, apiType: 'http', inventory }
  let run = getInvoker.bind({}, params)
  let mock
  let msg = 'Some invocation error'
  returnError = Error(msg)

  mock = arc7.noReturn
  run(mock, res => {
    t.match(res.body, new RegExp(msg), 'Invocation error passes along error message')
    t.equal(res.statusCode, 502, 'Responded with: 502')
  })

  teardown()
})

test('Architect v7 dependency-free responses (HTTP API mode)', t => {
  t.plan(46)
  let lambda = { method: 'GET', route: '/' }
  let params = { lambda, apiType: 'http', inventory }
  let run = getInvoker.bind({}, params)
  let mock

  mock = arc7.noReturn
  run(mock, res => {
    t.equal(res.body, 'null', `Returned string: 'null'`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc7.emptyReturn
  run(mock, res => {
    t.equal(res.body, mock, `Returned empty string: ${mock}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc7.string
  run(mock, res => {
    t.equal(res.body, mock, `Returned string: ${mock}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc7.object
  run(mock, res => {
    t.equal(res.body, str(mock), `Returned JSON-serialized object: ${str(mock)}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc7.array
  run(mock, res => {
    t.equal(res.body, str(mock), `Returned JSON-serialized array: ${str(mock)}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc7.buffer
  run(mock, res => {
    t.equal(res.body, str(mock), `Returned JSON-serialized buffer: ${str(mock)}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc7.number
  run(mock, res => {
    t.equal(res.body, str(mock), `Returned string: ${str(mock)}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc7.bodyOnly
  run(mock, res => {
    t.equal(res.body, str(mock), `Returned string: ${str(mock)}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc7.bodyWithStatus
  run(mock, res => {
    t.equal(res.body, mock.body, `Returned string: ${mock.body}`)
    t.equal(res.headers['content-type'], textUtf8, `Returned correct content-type: ${textUtf8}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc7.bodyWithStatusAndContentType
  run(mock, res => {
    t.equal(res.body, mock.body, `Returned string: ${mock.body}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc7.encodedWithBinaryType
  run(mock, res => {
    t.ok(res.body instanceof Buffer, 'Body is a buffer')
    t.equal(b64enc(res.body), mock.body, 'Passed back same buffer')
    t.equal(res.headers['content-type'], 'application/pdf', `Returned correct content-type: application/pdf`)
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc7.cookies
  run(mock, res => {
    t.equal(res.body, mock.body, `Returned string: ${mock.body}`)
    t.deepEqual(res.headers['set-cookie'], mock.cookies, `Returned correct cookies: ${JSON.stringify(res.headers['set-cookie'])}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc7.secureCookies
  run(mock, res => {
    let cookies = [ localCookie, localCookie ]
    t.equal(res.body, mock.body, `Returned string: ${mock.body}`)
    t.deepEqual(res.headers['set-cookie'], cookies, `Returned correct secure cookies: ${JSON.stringify(res.headers['set-cookie'])}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc7.secureCookieHeader
  run(mock, res => {
    t.equal(res.body, mock.body, `Returned string: ${mock.body}`)
    t.deepEqual(res.headers['set-cookie'], [ localCookie ], `Returned correct secure cookies from header: ${JSON.stringify(res.headers['set-cookie'])}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc7.invalid
  run(mock, res => {
    t.match(res.body, /Invalid response type/, 'Invalid statusCode causes error')
    t.equal(res.statusCode, 502, 'Responded with 502')
  })

  teardown()
})

test('Architect v7 dependency-free responses (HTTP API + Lambda v1.0)', t => {
  t.plan(30)
  let lambda = { method: 'GET', route: '/' }
  let params = { lambda, apiType: 'httpv1', inventory }
  let run = getInvoker.bind({}, params)
  let mock

  mock = arc6.body
  run(mock, res => {
    t.equal(res.body, mock.body, match('res.body', res.body))
    t.equal(res.headers['content-type'], jsonUtf8, `Returned correct content-type: ${jsonUtf8}`)
    t.notOk(res.isBase64Encoded, 'isBase64Encoded param NOT set automatically')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.isBase64Encoded
  run(mock, res => {
    t.equal(b64dec(mock.body), b64dec(res.body), match('res.body', res.body))
    t.equal(res.headers['content-type'], jsonUtf8, `Returned correct content-type: ${jsonUtf8}`)
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.buffer
  run(mock, res => {
    t.match(res.body, /Cannot respond with a raw buffer/, 'Raw buffer response causes error')
    t.equal(res.headers['content-type'], htmlUtf8, `Returned correct content-type: ${htmlUtf8}`)
    t.equal(res.statusCode, 502, 'Responded with 502')
  })

  mock = arc6.encodedWithBinaryTypeBad
  run(mock, res => {
    t.ok(typeof res.body === 'string', 'Body is (likely) base64 encoded')
    t.equal(b64dec(res.body), 'hi there\n', 'Body still base64 encoded')
    t.equal(res.headers['content-type'], 'application/pdf', `Returned correct content-type: application/pdf`)
    t.notOk(res.isBase64Encoded, 'isBase64Encoded param NOT set automatically')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.encodedWithBinaryTypeGood
  run(mock, res => {
    t.ok(res.body instanceof Buffer, 'Body is a buffer')
    t.equal(b64enc(res.body), mock.body, 'Passed back same buffer')
    t.equal(res.headers['content-type'], 'application/pdf', `Returned correct content-type: application/pdf`)
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.secureCookieHeader
  run(mock, res => {
    t.equal(res.headers['set-cookie'], localCookie, `Cookie SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.secureCookieMultiValueHeader
  run(mock, res => {
    t.equal(res.headers['set-cookie'][0], localCookie, `Cookie 1 SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.headers['set-cookie'][1], localCookie, `Cookie 2 SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.multiValueHeaders
  run(mock, res => {
    t.deepEqual(res.headers['set-cookie'], [ 'Foo', 'Bar', 'Baz' ], 'Header values set')
    t.equal(res.headers['content-type'], 'text/plain', 'Content-Type favors multiValueHeaders')
  })

  mock = arc6.invalidMultiValueHeaders
  run(mock, res => {
    t.match(res.body, /Invalid response type/, 'Invalid multiValueHeaders causes error')
    t.equal(res.statusCode, 502, 'Responded with 502')
  })

  teardown()
})

test('Architect v6 dependency-free responses (REST API mode)', t => {
  t.plan(30)
  let lambda = { method: 'GET', route: '/' }
  let params = { lambda, apiType: 'rest', inventory }
  let run = getInvoker.bind({}, params)
  let mock

  mock = arc6.body
  run(mock, res => {
    t.equal(res.body, mock.body, match('res.body', res.body))
    t.equal(res.headers['content-type'], jsonUtf8, `Returned correct content-type: ${jsonUtf8}`)
    t.notOk(res.isBase64Encoded, 'isBase64Encoded param NOT set automatically')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.isBase64Encoded
  run(mock, res => {
    t.equal(b64dec(mock.body), b64dec(res.body), match('res.body', res.body))
    t.equal(res.headers['content-type'], jsonUtf8, `Returned correct content-type: ${jsonUtf8}`)
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.buffer
  run(mock, res => {
    t.match(res.body, /Cannot respond with a raw buffer/, 'Raw buffer response causes error')
    t.equal(res.headers['content-type'], htmlUtf8, `Returned correct content-type: ${htmlUtf8}`)
    t.equal(res.statusCode, 502, 'Responded with 502')
  })

  mock = arc6.encodedWithBinaryTypeBad
  run(mock, res => {
    t.equals(typeof res.body, 'string', 'Body is (likely) base64 encoded')
    t.equal(b64dec(res.body), 'hi there\n', 'Body still base64 encoded')
    t.equal(res.headers['content-type'], 'application/pdf', `Returned correct content-type: application/pdf`)
    t.notOk(res.isBase64Encoded, 'isBase64Encoded param NOT set automatically')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.encodedWithBinaryTypeGood
  run(mock, res => {
    t.ok(res.body instanceof Buffer, 'Body is a buffer')
    t.equal(b64enc(res.body), mock.body, 'Passed back same buffer')
    t.equal(res.headers['content-type'], 'application/pdf', `Returned correct content-type: application/pdf`)
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.secureCookieHeader
  run(mock, res => {
    t.equal(res.headers['set-cookie'], localCookie, `Cookie SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.secureCookieMultiValueHeader
  run(mock, res => {
    t.equal(res.headers['set-cookie'][0], localCookie, `Cookie 1 SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.headers['set-cookie'][1], localCookie, `Cookie 2 SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.multiValueHeaders
  run(mock, res => {
    t.deepEqual(res.headers['set-cookie'], [ 'Foo', 'Bar', 'Baz' ], 'Header values set')
    t.equal(res.headers['content-type'], 'text/plain', 'Content-Type favors multiValueHeaders')
  })

  mock = arc6.invalidMultiValueHeaders
  run(mock, res => {
    t.match(res.body, /Invalid response type/, 'Invalid multiValueHeaders causes error')
    t.equal(res.statusCode, 502, 'Responded with 502')
  })

  teardown()
})
