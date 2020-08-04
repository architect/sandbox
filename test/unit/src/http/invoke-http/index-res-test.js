let test = require('tape')
let sinon = require('sinon')
let proxyquire = require('proxyquire')
let lambdaStub = sinon.stub().yields()
let invoke = proxyquire('../../../../../src/http/invoke-http', {
  '../../invoke-lambda': lambdaStub
})
let { arc6, arc5, arc } = require('../http-res-fixtures')

let b64dec = i => Buffer.from(i, 'base64').toString()
let b64enc = i => Buffer.from(i).toString('base64')
let str = i => JSON.stringify(i)
let match = (copy, item) => `${copy} matches: ${item}`
let json = 'application/json'
let utf8 = '; charset=utf-8'
let jsonUtf8 = json + utf8
let htmlUtf8 = `text/html${utf8};`
let textUtf8 = `text/plain${utf8}`
// Used for checking Sandbox mutation of SSL → local cookies
let localCookie = 'hi=there; Path=/'

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
    url: 'http://localhost:6666',
    body: {},
    headers: { 'Accept-Encoding': 'gzip' },
    params: {}
  }
  // Mocked res object
  let output = {
    getHeader: sinon.fake.returns(),
    removeHeader: sinon.fake.returns(),
    statusCode: sinon.fake.returns(),
    setHeader: sinon.fake.returns(),
    end: sinon.fake.returns()
  }
  lambdaStub.yields(null, response)
  let handler = invoke(params)
  handler(input, output)
  let res = parseOutput(output)
  callback(res)
}
function teardown () {
  lambdaStub.reset() // mostly jic
  delete process.env.DEPRECATED
}

test('Architect v6 dependency-free responses (HTTP API mode)', t => {
  t.plan(46)
  let params = { verb: 'GET', route: '/', apiType: 'http' }
  let run = getInvoker.bind({}, params)
  let mock

  mock = arc6.http.noReturn
  run(mock, res => {
    t.equal(res.body, 'null', `Returned string: 'null'`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc6.http.emptyReturn
  run(mock, res => {
    t.equal(res.body, mock, `Returned empty string: ${mock}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc6.http.string
  run(mock, res => {
    t.equal(res.body, mock, `Returned string: ${mock}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc6.http.object
  run(mock, res => {
    t.equal(res.body, str(mock), `Returned JSON-serialized object: ${str(mock)}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc6.http.array
  run(mock, res => {
    t.equal(res.body, str(mock), `Returned JSON-serialized array: ${str(mock)}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc6.http.buffer
  run(mock, res => {
    t.equal(res.body, str(mock), `Returned JSON-serialized buffer: ${str(mock)}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc6.http.number
  run(mock, res => {
    t.equal(res.body, str(mock), `Returned string: ${str(mock)}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc6.http.bodyOnly
  run(mock, res => {
    t.equal(res.body, str(mock), `Returned string: ${str(mock)}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc6.http.bodyWithStatus
  run(mock, res => {
    t.equal(res.body, mock.body, `Returned string: ${mock.body}`)
    t.equal(res.headers['content-type'], textUtf8, `Returned correct content-type: ${textUtf8}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc6.http.bodyWithStatusAndContentType
  run(mock, res => {
    t.equal(res.body, mock.body, `Returned string: ${mock.body}`)
    t.equal(res.headers['content-type'], json, `Returned correct content-type: ${json}`)
    t.equal(res.statusCode, 200, 'Responded with: 200')
  })

  mock = arc6.http.encodedWithBinaryType
  run(mock, res => {
    t.ok(res.body instanceof Buffer, 'Body is a buffer')
    t.equal(b64enc(res.body), mock.body, 'Passed back same buffer')
    t.equal(res.headers['content-type'], 'application/pdf', `Returned correct content-type: application/pdf`)
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.http.cookies
  run(mock, res => {
    t.equal(res.body, mock.body, `Returned string: ${mock.body}`)
    t.equal(res.headers['set-cookie'], mock.cookies.join('; '), `Returned correct cookies: ${res.headers['set-cookie']}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.http.secureCookies
  run(mock, res => {
    let cookies = `${localCookie}; ${localCookie}`
    t.equal(res.body, mock.body, `Returned string: ${mock.body}`)
    t.equal(res.headers['set-cookie'], cookies, `Returned correct cookies: ${cookies}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.http.secureCookieHeader
  run(mock, res => {
    t.equal(res.body, mock.body, `Returned string: ${mock.body}`)
    t.equal(res.headers['set-cookie'], localCookie, `Returned correct cookies: ${localCookie}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.http.invalid
  run(mock, res => {
    t.ok(res.body.includes('Invalid response type'), 'Invalid statusCode causes error')
    t.equal(res.statusCode, 502, 'Responded with 502')
  })

  teardown()
})

test('Architect v6 dependency-free responses (HTTP API + Lambda v1.0)', t => {
  t.plan(32)
  let params = { verb: 'GET', route: '/', apiType: 'httpv1' }
  let run = getInvoker.bind({}, params)
  let mock

  mock = arc6.rest.body
  run(mock, res => {
    t.equal(res.body, mock.body, match('res.body', res.body))
    t.equal(res.headers['content-type'], jsonUtf8, `Returned correct content-type: ${jsonUtf8}`)
    t.notOk(res.isBase64Encoded, 'isBase64Encoded param NOT set automatically')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.rest.isBase64Encoded
  run(mock, res => {
    t.equal(b64dec(mock.body), b64dec(res.body), match('res.body', res.body))
    t.equal(res.headers['content-type'], jsonUtf8, `Returned correct content-type: ${jsonUtf8}`)
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.rest.buffer
  run(mock, res => {
    t.ok(res.body.includes('Cannot respond with a raw buffer'), 'Raw buffer response causes error')
    t.equal(res.headers['content-type'], htmlUtf8, `Returned correct content-type: ${htmlUtf8}`)
    t.equal(res.statusCode, 502, 'Responded with 502')
  })

  mock = arc6.rest.encodedWithBinaryTypeBad
  run(mock, res => {
    t.ok(typeof res.body === 'string', 'Body is (likely) base64 encoded')
    t.equal(b64dec(res.body), 'hi there\n', 'Body still base64 encoded')
    t.equal(res.headers['content-type'], 'application/pdf', `Returned correct content-type: application/pdf`)
    t.notOk(res.isBase64Encoded, 'isBase64Encoded param NOT set automatically')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.rest.encodedWithBinaryTypeGood
  run(mock, res => {
    t.ok(res.body instanceof Buffer, 'Body is a buffer')
    t.equal(b64enc(res.body), mock.body, 'Passed back same buffer')
    t.equal(res.headers['content-type'], 'application/pdf', `Returned correct content-type: application/pdf`)
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.rest.secureCookieHeader
  run(mock, res => {
    t.equal(res.headers['set-cookie'], localCookie, `Cookie SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.rest.secureCookieMultiValueHeader
  run(mock, res => {
    t.equal(res.headers['set-cookie'][0], localCookie, `Cookie 1 SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.headers['set-cookie'][1], localCookie, `Cookie 2 SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc5.cookie
  run(mock, res => {
    t.notOk(res.body.includes('Invalid response parameter'), 'Arc v5 style cookie parameter is ignored')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.rest.multiValueHeaders
  run(mock, res => {
    t.deepEqual(res.headers['set-cookie'], [ 'Foo', 'Bar', 'Baz' ], 'Header values set')
    t.equal(res.headers['content-type'], 'text/plain', 'Content-Type favors multiValueHeaders')
  })

  mock = arc6.rest.invalidMultiValueHeaders
  run(mock, res => {
    t.ok(res.body.includes('Invalid response type'), 'Invalid multiValueHeaders causes error')
    t.equal(res.statusCode, 502, 'Responded with 502')
  })

  teardown()
})

test('Architect v6 dependency-free responses (REST API mode)', t => {
  t.plan(32)
  let params = { verb: 'GET', route: '/', apiType: 'rest' }
  let run = getInvoker.bind({}, params)
  let mock

  mock = arc6.rest.body
  run(mock, res => {
    t.equal(res.body, mock.body, match('res.body', res.body))
    t.equal(res.headers['content-type'], jsonUtf8, `Returned correct content-type: ${jsonUtf8}`)
    t.notOk(res.isBase64Encoded, 'isBase64Encoded param NOT set automatically')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.rest.isBase64Encoded
  run(mock, res => {
    t.equal(b64dec(mock.body), b64dec(res.body), match('res.body', res.body))
    t.equal(res.headers['content-type'], jsonUtf8, `Returned correct content-type: ${jsonUtf8}`)
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.rest.buffer
  run(mock, res => {
    t.ok(res.body.includes('Cannot respond with a raw buffer'), 'Raw buffer response causes error')
    t.equal(res.headers['content-type'], htmlUtf8, `Returned correct content-type: ${htmlUtf8}`)
    t.equal(res.statusCode, 502, 'Responded with 502')
  })

  mock = arc6.rest.encodedWithBinaryTypeBad
  run(mock, res => {
    t.ok(typeof res.body === 'string', 'Body is (likely) base64 encoded')
    t.equal(b64dec(res.body), 'hi there\n', 'Body still base64 encoded')
    t.equal(res.headers['content-type'], 'application/pdf', `Returned correct content-type: application/pdf`)
    t.notOk(res.isBase64Encoded, 'isBase64Encoded param NOT set automatically')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.rest.encodedWithBinaryTypeGood
  run(mock, res => {
    t.ok(res.body instanceof Buffer, 'Body is a buffer')
    t.equal(b64enc(res.body), mock.body, 'Passed back same buffer')
    t.equal(res.headers['content-type'], 'application/pdf', `Returned correct content-type: application/pdf`)
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.rest.secureCookieHeader
  run(mock, res => {
    t.equal(res.headers['set-cookie'], localCookie, `Cookie SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc6.rest.secureCookieMultiValueHeader
  run(mock, res => {
    t.equal(res.headers['set-cookie'][0], localCookie, `Cookie 1 SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.headers['set-cookie'][1], localCookie, `Cookie 2 SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc5.cookie
  run(mock, res => {
    t.ok(res.body.includes('Invalid response parameter'), 'Arc v5 style cookie parameter causes error')
    t.equal(res.statusCode, 502, 'Responded with 502')
  })

  mock = arc6.rest.multiValueHeaders
  run(mock, res => {
    t.deepEqual(res.headers['set-cookie'], [ 'Foo', 'Bar', 'Baz' ], 'Header values set')
    t.equal(res.headers['content-type'], 'text/plain', 'Content-Type favors multiValueHeaders')
  })

  mock = arc6.rest.invalidMultiValueHeaders
  run(mock, res => {
    t.ok(res.body.includes('Invalid response type'), 'Invalid multiValueHeaders causes error')
    t.equal(res.statusCode, 502, 'Responded with 502')
  })

  teardown()
})

test('Architect v5 (REST API mode) & Architect Functions', t => {
  t.plan(28)
  process.env.DEPRECATED = true
  let params = { verb: 'GET', route: '/', apiType: 'rest' }
  let run = getInvoker.bind({}, params)
  let mock
  let cacheControl = 'max-age=86400'
  let antiCache = 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'

  mock = arc5.body
  run(mock, res => {
    t.equal(str(mock.body), str(res.body), match('res.body', res.body))
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  // Same getHeader for arc5.cacheControl as in arc5.body
  mock = arc5.cacheControl
  run(mock, res => {
    t.equal(mock.headers['cache-control'], res.headers['Cache-Control'], match(`res.headers['Cache-Control']`, res.headers['Cache-Control']))
    if (mock.headers['cache-control'] && !res.headers['cache-control'])
      t.pass(`Headers normalized and de-duped: ${str(res.headers)}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc5.noCacheControlHTML
  run(mock, res => {
    t.equal(res.headers['Cache-Control'], antiCache, 'Default anti-caching headers set for HTML response')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc5.noCacheControlJSON
  run(mock, res => {
    t.equal(res.headers['Cache-Control'], antiCache, 'Default anti-caching headers set for JSON response')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  // Architect v5 only detected plain JSON, and not vendored JSON
  mock = arc5.noCacheControlJSONapi
  run(mock, res => {
    t.equal(res.headers['Cache-Control'], cacheControl, 'Default caching headers set for vnd.api+json response')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc5.noCacheControlOther
  run(mock, res => {
    t.equal(res.headers['Cache-Control'], cacheControl, 'Default caching headers set for non-HTML/JSON response')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc5.defaultsToJson
  run(mock, res => {
    t.ok(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc5.type
  run(mock, res => {
    t.equal(mock.type, res.headers['Content-Type'], `type matches res.headers['Content-Type']: ${res.headers['Content-Type']}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  // Testing that cookie is set, not that a valid cookie was passed
  mock = arc5.cookie
  run(mock, res => {
    t.equal(res.headers['Set-Cookie'], mock.cookie, `Cookie set: ${mock.cookie}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc5.secureCookie
  run(mock, res => {
    // Upcased bc VTL iirc
    t.equal(res.headers['Set-Cookie'], localCookie, `Cookie SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc5.secureCookieHeader
  run(mock, res => {
    // Lowcased by default otherwise iirc
    t.equal(res.headers['set-cookie'], localCookie, `Cookie SSL replaced with local path modification: ${localCookie}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc5.cors
  run(mock, res => {
    t.equal(res.headers['Access-Control-Allow-Origin'], '*', `CORS boolean set res.headers['Access-Control-Allow-Origin'] === '*'`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  mock = arc5.isBase64Encoded
  run(mock, res => {
    // arc5.isBase64Encoded.body mutated by invoke, so this test is not amazing ↓
    t.equal(mock.body, res.body, match('res.body', res.body))
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })

  teardown()
})

test('Architect <6 (REST API mode) & Architect Functions', t => {
  t.plan(4)
  process.env.DEPRECATED = true
  let params = { verb: 'GET', route: '/', apiType: 'rest' }
  let run = getInvoker.bind({}, params)
  let mock

  mock = arc.location
  run(mock, res => {
    t.equal(mock.location, res.headers.Location, match('res.headers.Location', res.headers.Location))
  })

  mock = arc.status
  run(mock, res => {
    t.equal(mock.status, res.statusCode, match('status', res.statusCode))
  })

  mock = arc.code
  run(mock, res => {
    t.equal(mock.code, res.statusCode, match('code', res.statusCode))
  })

  mock = arc.statusCode
  run(mock, res => {
    t.equal(mock.statusCode, res.statusCode, match('statusCode', res.statusCode))
  })

  teardown()
})
