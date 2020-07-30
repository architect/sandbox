let test = require('tape')
let sinon = require('sinon')
let proxyquire = require('proxyquire')
let lambdaStub = sinon.stub().yields()
let invoke = proxyquire('../../../../../src/http/invoke-http', {
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
  getHeader: sinon.fake(header => {
    if (header && header.toLowerCase() === 'cache-control') return undefined
    if (header && header.toLowerCase() === 'content-type') return 'application/json; charset=utf-8'
  }),
  removeHeader: sinon.fake.returns(),
  setHeader: sinon.fake.returns(),
  end: sinon.fake.returns()
}

let teardown = () => {
  lambdaStub.reset() // mostly jic
  delete process.env.DEPRECATED
}

/**
 * Checks AWS's funky multiValueHeaders + multiValueQueryStringParameters
 */
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

function checkV6RestResult (params, mock, req, t) {
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
  checkV6RestResult(params, mock, req, t)
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
  checkV6RestResult(params, mock, req, t)
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
  checkV6RestResult(params, mock, req, t)
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
  checkV6RestResult(params, mock, req, t)
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
  checkV6RestResult(params, mock, req, t)
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
  checkV6RestResult(params, mock, req, t)
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
  checkV6RestResult(params, mock, req, t)
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
  checkV6RestResult(params, mock, req, t)
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
  checkV6RestResult(params, mock, req, t)
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
  checkV6RestResult(params, mock, req, t)
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
  checkV6RestResult(params, mock, req, t)
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
  checkV6RestResult(params, mock, req, t)
})

/**
 * Arc v5
 */
test('Architect v5 (REST API mode): get /', t => {
  t.plan(6)
  let request = arc5.getIndex
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
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(apiGwHeaders(request.headers, true)), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5 (REST API mode): get /?whats=up', t => {
  t.plan(6)
  let request = arc5.getWithQueryString
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
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(apiGwHeaders(request.headers, true)), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5 (REST API mode): get /nature/hiking', t => {
  t.plan(6)
  let request = arc5.getWithParam
  process.env.DEPRECATED = true
  let verb = 'GET'
  let route = '/nature/:activities'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url('/nature/hiking'),
    body: {},
    headers,
    params: request.params
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(apiGwHeaders(request.headers, true)), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5 (REST API mode): post /form (JSON / form URL-encoded)', t => {
  t.plan(6)
  let request = arc5.post
  process.env.DEPRECATED = true
  let verb = 'POST'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(route),
    body: request.body,
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(apiGwHeaders(request.headers, true)), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5 (REST API mode): post /form (multipart form data-encoded)', t => {
  t.plan(6)
  let request = arc5.postBinary
  process.env.DEPRECATED = true
  let verb = 'POST'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(route),
    body: request.body,
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(apiGwHeaders(request.headers, true)), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5 (REST API mode): put /form', t => {
  t.plan(6)
  let request = arc5.put
  process.env.DEPRECATED = true
  let verb = 'PUT'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(route),
    body: request.body,
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(apiGwHeaders(request.headers, true)), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5 (REST API mode): patch /form', t => {
  t.plan(6)
  let request = arc5.patch
  process.env.DEPRECATED = true
  let verb = 'PATCH'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(route),
    body: request.body,
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(apiGwHeaders(request.headers, true)), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5 (REST API mode): delete /form', t => {
  t.plan(6)
  let request = arc5.delete
  process.env.DEPRECATED = true
  let verb = 'DELETE'
  let route = '/form'
  let apiType = 'rest'
  let handler = invoke({ verb, route, apiType })
  let input = {
    url: url(route),
    body: request.body,
    headers,
    params: {}
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(apiGwHeaders(request.headers, true)), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})
