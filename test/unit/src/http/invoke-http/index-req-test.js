let test = require('tape')
let sinon = require('sinon')
let proxyquire = require('proxyquire')
let lambdaStub = sinon.stub().yields()
let { join } = require('path')
let sut = join(process.cwd(), 'src', 'http', 'invoke-http')
let invoke = proxyquire(sut, {
  '../../invoke-lambda': lambdaStub
})
let { arc7, arc6, headers } = require('@architect/req-res-fixtures').http.req

let inventory = { inv: { _project: { preferences: null } } }
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
  getHeaders: () => ({ 'content-type': 'application/json; charset=utf-8' }),
  setHeader: sinon.fake.returns(),
  end: sinon.fake.returns()
}

function teardown () {
  lambdaStub.reset() // mostly jic
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
function checkArcV7HttpResult (mock, req, t) {
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

test('Architect v7 (HTTP API mode): get /', t => {
  let mock = arc7.getIndex
  t.plan(httpParams.length)
  let method = 'GET'
  let path = '/'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url(), // Set by `router` (interpolated, API passes path param)
    body: {},   // {} set by `body-parser` (Arc 5 == {}, Arc 6 == null)
    headers,    // Set by requesting client
    params: {}  // {} set by `router` (Arc 5 == {}, Arc 6 == null)
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP API mode): get /?whats=up', t => {
  let mock = arc7.getWithQueryString
  t.plan(httpParams.length)
  let method = 'GET'
  let path = '/'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('?whats=up'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP API mode): get /?whats=up&whats=there', t => {
  let mock = arc7.getWithQueryStringDuplicateKey
  t.plan(httpParams.length)
  let method = 'GET'
  let path = '/'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('?whats=up&whats=there'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP API mode): get /nature/hiking', t => {
  let mock = arc7.getWithParam
  t.plan(httpParams.length)
  let method = 'GET'
  let path = '/nature/:activities'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/nature/hiking'),
    body: {},
    headers,
    params: mock.pathParameters
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP API mode): get /{proxy+}', t => {
  let mock = arc7.getProxyPlus
  t.plan(httpParams.length)
  let method = 'GET'
  let path = '/*'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/nature/hiking'),
    body: {},
    headers,
    params: { '0': mock.pathParameters.proxy }
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP API mode): get /path/* (/path/hi/there)', t => {
  let mock = arc7.getCatchall
  t.plan(httpParams.length)
  let method = 'GET'
  let path = '/path/*'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/path/hi/there'),
    body: {},
    headers,
    params: { '0': mock.pathParameters.proxy }
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP API mode): get /:activities/{proxy+} (/nature/hiking/wilderness)', t => {
  let mock = arc7.getWithParamAndCatchall
  t.plan(httpParams.length)
  let method = 'GET'
  let path = '/:activities/*'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/nature/hiking/wilderness'),
    body: {},
    headers,
    params: {
      activities: 'nature',
      '0': mock.pathParameters.proxy
    }
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP API mode): post /form (JSON)', t => {
  let mock = arc7.postJson
  t.plan(httpParams.length)
  let method = 'POST'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: false // Assumes flag is set in binary handler
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): post /form (form URL encoded)', t => {
  let mock = arc7.postFormURL
  t.plan(httpParams.length)
  let method = 'POST'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP API mode): post /form (multipart form data)', t => {
  let mock = arc7.postMultiPartFormData
  t.plan(httpParams.length)
  let method = 'POST'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true // Assumes flag is set in binary handler
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP API mode): post /form (octet stream)', t => {
  let mock = arc7.postOctetStream
  t.plan(httpParams.length)
  let method = 'POST'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true // Assumes flag is set in binary handler
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP API mode): put /form (JSON)', t => {
  let mock = arc7.putJson
  t.plan(httpParams.length)
  let method = 'PUT'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: false // Assumes flag is set in binary handler
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP API mode): patch /form (JSON)', t => {
  let mock = arc7.patchJson
  t.plan(httpParams.length)
  let method = 'PATCH'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: false // Assumes flag is set in binary handler
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
})

test('Architect v7 (HTTP API mode): delete /form (JSON)', t => {
  let mock = arc7.deleteJson
  t.plan(httpParams.length)
  let method = 'DELETE'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'http'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: false // Assumes flag is set in binary handler
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV7HttpResult(mock, req, t)
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
test('Architect v7 (HTTP + Lambda 1.0 payload): get /', t => {
  let mock = arc6.getIndex
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'GET'
  let path = '/'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url(), // Set by `router` (interpolated, API passes path param)
    body: {},   // {} set by `body-parser` (Arc 5 == {}, Arc 6 == null)
    headers,    // Set by requesting client
    params: {}  // {} set by `router` (Arc 5 == {}, Arc 6 == null)
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): get /?whats=up', t => {
  let mock = arc6.getWithQueryString
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'GET'
  let path = '/'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('?whats=up'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): get /?whats=up&whats=there', t => {
  let mock = arc6.getWithQueryStringDuplicateKey
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'GET'
  let path = '/'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('?whats=up&whats=there'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): get /nature/hiking', t => {
  let mock = arc6.getWithParam
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'GET'
  let path = '/nature/:activities'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/nature/hiking'),
    body: {},
    headers,
    params: mock.pathParameters
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): get /{proxy+}', t => {
  let mock = arc6.getProxyPlus
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'GET'
  let path = '/*'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/nature/hiking'),
    body: {},
    headers,
    params: { '0': mock.pathParameters.proxy }
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): get /path/* (/path/hi/there)', t => {
  let mock = arc6.getCatchall
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'GET'
  let path = '/path/*'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/path/hi/there'),
    body: {},
    headers,
    params: { '0': mock.pathParameters.proxy }
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): get /:activities/{proxy+} (/nature/hiking/wilderness)', t => {
  let mock = arc6.getWithParamAndCatchall
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'GET'
  let path = '/:activities/*'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/nature/hiking/wilderness'),
    body: {},
    headers,
    params: {
      activities: 'nature',
      '0': mock.pathParameters.proxy
    }
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): post /form (JSON)', t => {
  let mock = arc6.postJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'POST'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true // Assumes flag is set in binary handler
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): post /form (form URL encoded)', t => {
  let mock = arc6.postFormURL
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'POST'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): post /form (multipart form data)', t => {
  let mock = arc6.postMultiPartFormData
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'POST'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): post /form (octet stream)', t => {
  let mock = arc6.postOctetStream
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'POST'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): put /form (JSON)', t => {
  let mock = arc6.putJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'PUT'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): patch /form (JSON)', t => {
  let mock = arc6.patchJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'PATCH'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v7 (HTTP + Lambda 1.0 payload): delete /form (JSON)', t => {
  let mock = arc6.deleteJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'DELETE'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'httpv1'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})


/**
 * Arc v6 (REST)
 */
test('Architect v6 (REST API mode): get /', t => {
  let mock = arc6.getIndex
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'GET'
  let path = '/'
  let lambda = { method, path }
  let apiType = 'rest'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url(), // Set by `router` (interpolated, API passes path param)
    body: {},   // {} set by `body-parser` (Arc 5 == {}, Arc 6 == null)
    headers,    // Set by requesting client
    params: {}  // {} set by `router` (Arc 5 == {}, Arc 6 == null)
  }
  handler(input, response)
  // Compare handler-generated request to mock
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): get /?whats=up', t => {
  let mock = arc6.getWithQueryString
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'GET'
  let path = '/'
  let lambda = { method, path }
  let apiType = 'rest'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('?whats=up'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): get /?whats=up&whats=there', t => {
  let mock = arc6.getWithQueryStringDuplicateKey
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'GET'
  let path = '/'
  let lambda = { method, path }
  let apiType = 'rest'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('?whats=up&whats=there'),
    body: {},
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): get /nature/hiking', t => {
  let mock = arc6.getWithParam
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'GET'
  let path = '/nature/:activities'
  let lambda = { method, path }
  let apiType = 'rest'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/nature/hiking'),
    body: {},
    headers,
    params: mock.pathParameters
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): get /{proxy+}', t => {
  // Not normally how we'd do this test but get /{proxy+} in REST-land is only possible via greedy root, so resource, params, etc. are passed in via middleware
  let mock = arc6.getProxyPlus
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'GET'
  let path = '/' // Would normally be /*
  let lambda = { method, path }
  let apiType = 'rest'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/nature/hiking'),
    resource: '/{proxy+}', // The only time we should be using this
    body: {},
    headers,
    params: mock.pathParameters // Would normally be { '0': ... }
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): post /form (JSON)', t => {
  let mock = arc6.postJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'POST'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'rest'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true // Assumes flag is set in binary handler
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): post /form (form URL encoded)', t => {
  let mock = arc6.postFormURL
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'POST'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'rest'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): post /form (multipart form data)', t => {
  let mock = arc6.postMultiPartFormData
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'POST'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'rest'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): post /form (octet stream)', t => {
  let mock = arc6.postOctetStream
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'POST'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'rest'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): put /form (JSON)', t => {
  let mock = arc6.putJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'PUT'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'rest'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): patch /form (JSON)', t => {
  let mock = arc6.patchJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'PATCH'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'rest'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})

test('Architect v6 (REST API mode): delete /form (JSON)', t => {
  let mock = arc6.deleteJson
  let params = Object.keys(mock)
  t.plan(params.length + 2)
  let method = 'DELETE'
  let path = '/form'
  let lambda = { method, path }
  let apiType = 'rest'
  let handler = invoke({ lambda, apiType, inventory })
  let input = {
    url: url('/form'),
    body: mock.body,
    headers: mock.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][0].event
  checkArcV6RestResult(params, mock, req, t)
})
