let test = require('tape')
let sinon = require('sinon')
let proxyquire = require('proxyquire')
let lambdaStub = sinon.stub().yields()
let { join } = require('path')
let sut = join(process.cwd(), 'src', 'http', 'invoke-http')
let invoke = proxyquire(sut, {
  '../../invoke-lambda': lambdaStub
})
let { arc6, arc5, headers } = require('../http-req-fixtures')

lambdaStub.yields(null, {})

function apiGwHeaders (headers, v5) {
  let normal = {}
  Object.entries(headers).forEach(([ h, v ]) => {
    let header = h.toLowerCase()
    if (header === 'cookie' && v5) header = 'Cookie'
    normal[header] = v
  })
  return normal
}

let url = i => `http://localhost:6666${i ? i : ''}`
let str = i => JSON.stringify(i)
let match = (copy, item) => `${copy} matches: ${str(item)}`
let response = {
  getHeader: sinon.fake(h => {
    let header = h && h.toLowerCase()
    if (header === 'cache-control') return undefined
    if (header === 'content-type') return 'application/json; charset=utf-8'
  }),
  setHeader: sinon.fake.returns(),
  end: sinon.fake.returns()
}

function teardown () {
  lambdaStub.reset() // mostly jic
  delete process.env.DEPRECATED
}


/**
 * Arc v6 (HTTP API mode)
 */
let httpParams = [
  'version',
  'routeKey',
  'rawPath',
  'rawQueryString',
  'cookies',                // Not always present
  'headers',
  'queryStringParameters',  // Not always present
  'requestContext',
  'pathParameters',         // Not always present
  'body',                   // Not always present
  'isBase64Encoded',
]
// HTTP APIs mutate headers when it contains cookies
// tbqh I also can't resist eating cookies, either
function eatCookies (headers) {
  let sheet = {}
  Object.entries(headers).forEach(([ header, value ]) => {
    if (header !== 'cookie') sheet[header] = value
  })
  return sheet
}

// Reusable result checker
function checkArcV6HttpResult (mock, req, t) {
  httpParams.forEach(param => {
    let ref = param === 'headers'
      ? eatCookies(mock[param])
      : mock[param]
    t.equal(
      str(ref),
      str(req[param]),
      match(`${param}`, req[param])
    )
  })
  teardown()
}

test('Architect v6 (HTTP API mode): get /', t => {
  let mock = arc6.http.getIndex
  t.plan(httpParams.length)
  let verb = 'GET'
  let route = '/'
  let apiType = 'http'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(), // Set by `router` (interpolated, API passes path param)
    body: {},   // {} set by `body-parser` (Arc 5 == {}, Arc 6 == null)
    headers,    // Set by requesting client
    params: {}  // {} set by `router` (Arc 5 == {}, Arc 6 == null)
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6HttpResult(mock, req, t)
})

test('Architect v6 (HTTP API mode): get /?whats=up', t => {
  let mock = arc6.http.getWithQueryString
  t.plan(httpParams.length)
  let verb = 'GET'
  let route = '/'
  let apiType = 'http'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('?whats=up'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6HttpResult(mock, req, t)
})

test('Architect v6 (HTTP API mode): get /?whats=up&whats=there', t => {
  let mock = arc6.http.getWithQueryStringDuplicateKey
  t.plan(httpParams.length)
  let verb = 'GET'
  let route = '/'
  let apiType = 'http'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('?whats=up&whats=there'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6HttpResult(mock, req, t)
})

test('Architect v6 (HTTP API mode): get /nature/hiking', t => {
  let mock = arc6.http.getWithParam
  t.plan(httpParams.length)
  let verb = 'GET'
  let route = '/nature/:activities'
  let apiType = 'http'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/nature/hiking'),
    body: {},
    headers,
    params: mock.pathParameters
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6HttpResult(mock, req, t)
})

test('Architect v6 (HTTP API mode): get /$default', t => {
  let mock = arc6.http.get$default
  t.plan(httpParams.length)
  let verb = 'GET'
  let $default = true // Unlike normal requests, fallbacks to $default don't include a route
  let apiType = 'http'
  let handler = invoke({ verb, apiType, $default })
  let input = {
    url: url('/nature/hiking'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6HttpResult(mock, req, t)
})

test('Architect v6 (HTTP API mode): post /form (JSON)', t => {
  let mock = arc6.http.postJson
  t.plan(httpParams.length)
  let verb = 'POST'
  let route = '/form'
  let apiType = 'http'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: false // Assumes flag is set in binary handler
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6HttpResult(mock, req, t)
})

test('Architect v6 (HTTP API mode): post /form (multipart form data)', t => {
  let mock = arc6.http.postMultiPartFormData
  t.plan(httpParams.length)
  let verb = 'POST'
  let route = '/form'
  let apiType = 'http'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true // Assumes flag is set in binary handler
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6HttpResult(mock, req, t)
})

test('Architect v6 (HTTP API mode): post /form (octet stream)', t => {
  let mock = arc6.http.postOctetStream
  t.plan(httpParams.length)
  let verb = 'POST'
  let route = '/form'
  let apiType = 'http'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true // Assumes flag is set in binary handler
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6HttpResult(mock, req, t)
})

test('Architect v6 (HTTP API mode): put /form (JSON)', t => {
  let mock = arc6.http.putJson
  t.plan(httpParams.length)
  let verb = 'PUT'
  let route = '/form'
  let apiType = 'http'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: false // Assumes flag is set in binary handler
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6HttpResult(mock, req, t)
})

test('Architect v6 (HTTP API mode): patch /form (JSON)', t => {
  let mock = arc6.http.patchJson
  t.plan(httpParams.length)
  let verb = 'PATCH'
  let route = '/form'
  let apiType = 'http'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: false // Assumes flag is set in binary handler
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6HttpResult(mock, req, t)
})

test('Architect v6 (HTTP API mode): delete /form (JSON)', t => {
  let mock = arc6.http.deleteJson
  t.plan(httpParams.length)
  let verb = 'DELETE'
  let route = '/form'
  let apiType = 'http'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: false // Assumes flag is set in binary handler
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6HttpResult(mock, req, t)
})


/**
 * Arc v6 (REST API mode)
 */
// Checks AWS's funky multiValueHeaders + multiValueQueryStringParameters
function checkMultiValueHeaders (mock, req, t) {
  let headers = apiGwHeaders(mock.headers)
  // Fixtures always have headers
  for (let header of Object.keys(headers)) {
    if (headers[header] !== req.multiValueHeaders[header][0])
      t.fail(`Could not find ${header} in multiValueHeaders`)
  }
  t.pass('multiValueHeaders checked out')
}
function checkMultiValueQueryStringParameters (mock, req, t) {
  if (mock.queryStringParameters === req.multiValueQueryStringParameters) {
    t.pass('multiValueQueryStringParameters checked out')
  }
  if (mock.queryStringParameters === null &&
      req.multiValueQueryStringParameters !== null) {
    t.fail(`multiValueQueryStringParameters is not null`)
  }
  else if (mock.queryStringParameters !== null) {
    if (str(mock.queryStringParameters) !== str(req.queryStringParameters))
      t.fail(`queryStringParameters is not the same`)
    for (let param of Object.keys(mock.queryStringParameters)) {
      if (mock.queryStringParameters[param] !==
          req.multiValueQueryStringParameters[param][req.multiValueQueryStringParameters[param].length - 1])
        t.fail(`Could not find '${param}' key in multiValueQueryStringParameters`)
    }
    t.pass('multiValueQueryStringParameters checked out')
  }
}

// Reusable result checker
function checkArcV6RestResult (params, mock, req, t) {
  params.forEach(param => {
    t.equal(
      str(mock[param]),
      str(req[param]),
      match(`${param}`, req[param])
    )
  })
  checkMultiValueHeaders(mock, req, t)
  checkMultiValueQueryStringParameters(mock, req, t)
  teardown()
}

/**
 * Arc v6 (HTTP + Lambda 1.0 payload)
 */
test('Architect v6 (HTTP + Lambda 1.0 payload): get /', t => {
  let mock = arc6.rest.getIndex
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'GET'
  let route = '/'
  let apiType = 'httpv1'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(), // Set by `router` (interpolated, API passes path param)
    body: {},   // {} set by `body-parser` (Arc 5 == {}, Arc 6 == null)
    headers,    // Set by requesting client
    params: {}  // {} set by `router` (Arc 5 == {}, Arc 6 == null)
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (HTTP + Lambda 1.0 payload): get /?whats=up', t => {
  let mock = arc6.rest.getWithQueryString
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'GET'
  let route = '/'
  let apiType = 'httpv1'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('?whats=up'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (HTTP + Lambda 1.0 payload): get /?whats=up&whats=there', t => {
  let mock = arc6.rest.getWithQueryStringDuplicateKey
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'GET'
  let route = '/'
  let apiType = 'httpv1'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('?whats=up&whats=there'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (HTTP + Lambda 1.0 payload): get /nature/hiking', t => {
  let mock = arc6.rest.getWithParam
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'GET'
  let route = '/nature/:activities'
  let apiType = 'httpv1'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/nature/hiking'),
    body: {},
    headers,
    params: mock.pathParameters
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (HTTP + Lambda 1.0 payload): get /{proxy+}', t => {
  let mock = arc6.rest.getProxyPlus
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'GET'
  let route = '/'
  let apiType = 'httpv1'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/nature/hiking'),
    resource: '/{proxy+}',
    body: {},
    headers,
    params: mock.pathParameters
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (HTTP + Lambda 1.0 payload): post /form (JSON)', t => {
  let mock = arc6.rest.postJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'POST'
  let route = '/form'
  let apiType = 'httpv1'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true // Assumes flag is set in binary handler
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (HTTP + Lambda 1.0 payload): post /form (form URL encoded)', t => {
  let mock = arc6.rest.postFormURL
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'POST'
  let route = '/form'
  let apiType = 'httpv1'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
  teardown()
})

test('Architect v6 (HTTP + Lambda 1.0 payload): post /form (multipart form data)', t => {
  let mock = arc6.rest.postMultiPartFormData
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'POST'
  let route = '/form'
  let apiType = 'httpv1'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (HTTP + Lambda 1.0 payload): post /form (octet stream)', t => {
  let mock = arc6.rest.postOctetStream
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'POST'
  let route = '/form'
  let apiType = 'httpv1'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (HTTP + Lambda 1.0 payload): put /form (JSON)', t => {
  let mock = arc6.rest.putJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'PUT'
  let route = '/form'
  let apiType = 'httpv1'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (HTTP + Lambda 1.0 payload): patch /form (JSON)', t => {
  let mock = arc6.rest.patchJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'PATCH'
  let route = '/form'
  let apiType = 'httpv1'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (HTTP + Lambda 1.0 payload): delete /form (JSON)', t => {
  let mock = arc6.rest.deleteJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'DELETE'
  let route = '/form'
  let apiType = 'httpv1'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})


/**
 * Arc v6 (REST)
 */
test('Architect v6 (REST API mode): get /', t => {
  let mock = arc6.rest.getIndex
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'GET'
  let route = '/'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(), // Set by `router` (interpolated, API passes path param)
    body: {},   // {} set by `body-parser` (Arc 5 == {}, Arc 6 == null)
    headers,    // Set by requesting client
    params: {}  // {} set by `router` (Arc 5 == {}, Arc 6 == null)
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): get /?whats=up', t => {
  let mock = arc6.rest.getWithQueryString
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'GET'
  let route = '/'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('?whats=up'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): get /?whats=up&whats=there', t => {
  let mock = arc6.rest.getWithQueryStringDuplicateKey
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'GET'
  let route = '/'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('?whats=up&whats=there'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): get /nature/hiking', t => {
  let mock = arc6.rest.getWithParam
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'GET'
  let route = '/nature/:activities'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/nature/hiking'),
    body: {},
    headers,
    params: mock.pathParameters
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): get /{proxy+}', t => {
  let mock = arc6.rest.getProxyPlus
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'GET'
  let route = '/'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/nature/hiking'),
    resource: '/{proxy+}',
    body: {},
    headers,
    params: mock.pathParameters
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): post /form (JSON)', t => {
  let mock = arc6.rest.postJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'POST'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true // Assumes flag is set in binary handler
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): post /form (form URL encoded)', t => {
  let mock = arc6.rest.postFormURL
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'POST'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
  teardown()
})

test('Architect v6 (REST API mode): post /form (multipart form data)', t => {
  let mock = arc6.rest.postMultiPartFormData
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'POST'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): post /form (octet stream)', t => {
  let mock = arc6.rest.postOctetStream
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'POST'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): put /form (JSON)', t => {
  let mock = arc6.rest.putJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'PUT'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): patch /form (JSON)', t => {
  let mock = arc6.rest.patchJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'PATCH'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): delete /form (JSON)', t => {
  let mock = arc6.rest.deleteJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let verb = 'DELETE'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV6RestResult(params, mock, req, t)
})


/**
 * Arc v5 (REST)
 */
function upcaseCookie (headers) {
  let sheet = {}
  Object.entries(headers).forEach(([ header, value ]) => {
    if (header === 'cookie') sheet.Cookie = value
    else sheet[header] = value
  })
  return sheet
}

// Reusable result checker
function checkArcV5RestResult (params, mock, req, t) {
  params.forEach(param => {
    let ref = param === 'headers'
      ? upcaseCookie(mock[param])
      : mock[param]
    t.equal(
      str(ref),
      str(req[param]),
      match(`${param}`, req[param])
    )
  })
  teardown()
}

test('Architect v5 (REST API mode): get /', t => {
  let mock = arc5.getIndex
  let params = Object.keys(mock)
  t.plan(params.length)
  process.env.DEPRECATED = true
  let verb = 'GET'
  let route = '/'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(), // Set by `router` (interpolated, API passes path param)
    body: {},   // {} set by `body-parser` (Arc 5 == {}, Arc 6 == null)
    headers,    // Set by requesting client
    params: {}  // {} set by `router` (Arc 5 == {}, Arc 6 == null)
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][1]
  checkArcV5RestResult(params, mock, req, t)
})

test('Architect v5 (REST API mode): get /?whats=up', t => {
  let mock = arc5.getWithQueryString
  let params = Object.keys(mock)
  t.plan(params.length)
  process.env.DEPRECATED = true
  let verb = 'GET'
  let route = '/'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('?whats=up'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV5RestResult(params, mock, req, t)
})

test('Architect v5 (REST API mode): get /nature/hiking', t => {
  let mock = arc5.getWithParam
  let params = Object.keys(mock)
  t.plan(params.length)
  process.env.DEPRECATED = true
  let verb = 'GET'
  let route = '/nature/:activities'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/nature/hiking'),
    body: {},
    headers,
    params: mock.params
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV5RestResult(params, mock, req, t)
})

test('Architect v5 (REST API mode): post /form (JSON / form URL-encoded)', t => {
  let mock = arc5.post
  let params = Object.keys(mock)
  t.plan(params.length)
  process.env.DEPRECATED = true
  let verb = 'POST'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(route),
    body: mock.body,
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV5RestResult(params, mock, req, t)
})

test('Architect v5 (REST API mode): post /form (multipart form data-encoded)', t => {
  let mock = arc5.postBinary
  let params = Object.keys(mock)
  t.plan(params.length)
  process.env.DEPRECATED = true
  let verb = 'POST'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(route),
    body: mock.body,
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV5RestResult(params, mock, req, t)
})

test('Architect v5 (REST API mode): put /form', t => {
  let mock = arc5.put
  let params = Object.keys(mock)
  t.plan(params.length)
  process.env.DEPRECATED = true
  let verb = 'PUT'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(route),
    body: mock.body,
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV5RestResult(params, mock, req, t)
})

test('Architect v5 (REST API mode): patch /form', t => {
  let mock = arc5.patch
  let params = Object.keys(mock)
  t.plan(params.length)
  process.env.DEPRECATED = true
  let verb = 'PATCH'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(route),
    body: mock.body,
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV5RestResult(params, mock, req, t)
})

test('Architect v5 (REST API mode): delete /form', t => {
  let mock = arc5.delete
  let params = Object.keys(mock)
  t.plan(params.length)
  process.env.DEPRECATED = true
  let verb = 'DELETE'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(route),
    body: mock.body,
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  checkArcV5RestResult(params, mock, req, t)
})
