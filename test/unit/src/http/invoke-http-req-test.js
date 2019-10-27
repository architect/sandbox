let test = require('tape')
let sinon = require('sinon')
let proxyquire = require('proxyquire')
let lambdaStub = sinon.stub().yields()
let invoke = proxyquire('../../../../src/http/invoke-http', {
  '../../invoke-lambda': lambdaStub
})
let reqs = require('./http-req-fixtures')

lambdaStub.yields(null, {})
let headers = {'Accept-Encoding': 'gzip'}
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

test('Architect v6: get /', t => {
  t.plan(6)
  let request = reqs.arc6.getIndex
  let verb = 'GET'
  let route = '/'
  let handler = invoke({verb, route})
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
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  t.equal(str(request.httpMethod), str(req.httpMethod), match('req.httpMethod', req.httpMethod))
  t.equal(str(request.pathParameters), str(req.pathParameters), match('req.pathParameters', req.pathParameters))
  t.equal(str(req.queryStringParameters), str(req.queryStringParameters), match('req.queryStringParameters', req.queryStringParameters))
  teardown()
})

test('Architect v6: get /?whats=up', t => {
  t.plan(6)
  let request = reqs.arc6.getWithQueryString
  let verb = 'GET'
  let route = '/'
  let handler = invoke({verb, route})
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
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  t.equal(str(request.httpMethod), str(req.httpMethod), match('req.httpMethod', req.httpMethod))
  t.equal(str(request.pathParameters), str(req.pathParameters), match('req.pathParameters', req.pathParameters))
  t.equal(str(req.queryStringParameters), str(req.queryStringParameters), match('req.queryStringParameters', req.queryStringParameters))
  teardown()
})

test('Architect v6: get /nature/hiking', t => {
  t.plan(7)
  let request = reqs.arc6.getWithParam
  let verb = 'GET'
  let route = '/nature/:activities'
  let handler = invoke({verb, route})
  let input = {
    url: url('/nature/hiking'),
    body: {},
    headers,
    params: request.pathParameters
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(request.resource), str(req.resource), match('req.resource', req.resource))
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  t.equal(str(request.httpMethod), str(req.httpMethod), match('req.httpMethod', req.httpMethod))
  t.equal(str(request.pathParameters), str(req.pathParameters), match('req.pathParameters', req.pathParameters))
  t.equal(str(req.queryStringParameters), str(req.queryStringParameters), match('req.queryStringParameters', req.queryStringParameters))
  teardown()
})

test('Architect v6: get /{proxy+}', t => {
  t.plan(7)
  let request = reqs.arc6.getProxyPlus
  let verb = 'GET'
  let route = '/'
  let handler = invoke({verb, route})
  let input = {
    url: url('/nature/hiking'),
    resource: '/{proxy+}',
    body: {},
    headers,
    params: request.pathParameters
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(request.resource), str(req.resource), match('req.resource', req.resource))
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  t.equal(str(request.httpMethod), str(req.httpMethod), match('req.httpMethod', req.httpMethod))
  t.equal(str(request.pathParameters), str(req.pathParameters), match('req.pathParameters', req.pathParameters))
  t.equal(str(req.queryStringParameters), str(req.queryStringParameters), match('req.queryStringParameters', req.queryStringParameters))
  teardown()
})

test('Architect v6: post /form (JSON)', t => {
  t.plan(7)
  let request = reqs.arc6.postJson
  let verb = 'POST'
  let route = '/form'
  let handler = invoke({verb, route})
  let input = {
    url: url('/form'),
    body: request.body,
    headers: request.headers,
    params: {},
    isBase64Encoded: true // Assumes flag is set in binary handler
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  t.equal(str(request.httpMethod), str(req.httpMethod), match('req.httpMethod', req.httpMethod))
  t.equal(str(request.pathParameters), str(req.pathParameters), match('req.pathParameters', req.pathParameters))
  t.equal(str(req.queryStringParameters), str(req.queryStringParameters), match('req.queryStringParameters', req.queryStringParameters))
  lambdaStub.reset()
  t.ok(req.isBase64Encoded, 'req.isBase64Encoded present')
  teardown()
})

test('Architect v6: post /form (form URL encoded)', t => {
  t.plan(7)
  let request = reqs.arc6.postFormURL
  let verb = 'POST'
  let route = '/form'
  let handler = invoke({verb, route})
  let input = {
    url: url('/form'),
    body: request.body,
    headers: request.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  t.equal(str(request.httpMethod), str(req.httpMethod), match('req.httpMethod', req.httpMethod))
  t.equal(str(request.pathParameters), str(req.pathParameters), match('req.pathParameters', req.pathParameters))
  t.equal(str(req.queryStringParameters), str(req.queryStringParameters), match('req.queryStringParameters', req.queryStringParameters))
  t.ok(req.isBase64Encoded, 'req.isBase64Encoded present')
  teardown()
})

test('Architect v6: post /form (multipart form data)', t => {
  t.plan(7)
  let request = reqs.arc6.postMultiPartFormData
  let verb = 'POST'
  let route = '/form'
  let handler = invoke({verb, route})
  let input = {
    url: url('/form'),
    body: request.body,
    headers: request.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  t.equal(str(request.httpMethod), str(req.httpMethod), match('req.httpMethod', req.httpMethod))
  t.equal(str(request.pathParameters), str(req.pathParameters), match('req.pathParameters', req.pathParameters))
  t.equal(str(req.queryStringParameters), str(req.queryStringParameters), match('req.queryStringParameters', req.queryStringParameters))
  t.ok(req.isBase64Encoded, 'req.isBase64Encoded present')
  teardown()
})

test('Architect v6: post /form (octet stream)', t => {
  t.plan(7)
  let request = reqs.arc6.postOctetStream
  let verb = 'POST'
  let route = '/form'
  let handler = invoke({verb, route})
  let input = {
    url: url('/form'),
    body: request.body,
    headers: request.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  t.equal(str(request.httpMethod), str(req.httpMethod), match('req.httpMethod', req.httpMethod))
  t.equal(str(request.pathParameters), str(req.pathParameters), match('req.pathParameters', req.pathParameters))
  t.equal(str(req.queryStringParameters), str(req.queryStringParameters), match('req.queryStringParameters', req.queryStringParameters))
  t.ok(req.isBase64Encoded, 'req.isBase64Encoded present')
  teardown()
})

test('Architect v6: put /form (JSON)', t => {
  t.plan(7)
  let request = reqs.arc6.putJson
  let verb = 'PUT'
  let route = '/form'
  let handler = invoke({verb, route})
  let input = {
    url: url('/form'),
    body: request.body,
    headers: request.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  t.equal(str(request.httpMethod), str(req.httpMethod), match('req.httpMethod', req.httpMethod))
  t.equal(str(request.pathParameters), str(req.pathParameters), match('req.pathParameters', req.pathParameters))
  t.equal(str(req.queryStringParameters), str(req.queryStringParameters), match('req.queryStringParameters', req.queryStringParameters))
  t.ok(req.isBase64Encoded, 'req.isBase64Encoded present')
  teardown()
})

test('Architect v6: patch /form (JSON)', t => {
  t.plan(7)
  let request = reqs.arc6.patchJson
  let verb = 'PATCH'
  let route = '/form'
  let handler = invoke({verb, route})
  let input = {
    url: url('/form'),
    body: request.body,
    headers: request.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  t.equal(str(request.httpMethod), str(req.httpMethod), match('req.httpMethod', req.httpMethod))
  t.equal(str(request.pathParameters), str(req.pathParameters), match('req.pathParameters', req.pathParameters))
  t.equal(str(req.queryStringParameters), str(req.queryStringParameters), match('req.queryStringParameters', req.queryStringParameters))
  t.ok(req.isBase64Encoded, 'req.isBase64Encoded present')
  teardown()
})

test('Architect v6: delete /form (JSON)', t => {
  t.plan(7)
  let request = reqs.arc6.deleteJson
  let verb = 'DELETE'
  let route = '/form'
  let handler = invoke({verb, route})
  let input = {
    url: url('/form'),
    body: request.body,
    headers: request.headers,
    params: {},
    isBase64Encoded: true
  }
  handler(input, response)
  let req = lambdaStub.args[0][1]
  t.equal(str(request.body), str(req.body), match('req.body', req.body))
  t.equal(str(request.path), str(req.path), match('req.path', req.path))
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  t.equal(str(request.httpMethod), str(req.httpMethod), match('req.httpMethod', req.httpMethod))
  t.equal(str(request.pathParameters), str(req.pathParameters), match('req.pathParameters', req.pathParameters))
  t.equal(str(req.queryStringParameters), str(req.queryStringParameters), match('req.queryStringParameters', req.queryStringParameters))
  t.ok(req.isBase64Encoded, 'req.isBase64Encoded present')
  teardown()
})

test('Architect v5: get /', t => {
  t.plan(6)
  let request = reqs.arc5.getIndex
  process.env.DEPRECATED = true
  let verb = 'GET'
  let route = '/'
  let handler = invoke({verb, route})
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
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5: get /?whats=up', t => {
  t.plan(6)
  let request = reqs.arc5.getWithQueryString
  process.env.DEPRECATED = true
  let verb = 'GET'
  let route = '/'
  let handler = invoke({verb, route})
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
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5: get /nature/hiking', t => {
  t.plan(6)
  let request = reqs.arc5.getWithParam
  process.env.DEPRECATED = true
  let verb = 'GET'
  let route = '/nature/:activities'
  let handler = invoke({verb, route})
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
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5: post /form (JSON / form URL-encoded)', t => {
  t.plan(6)
  let request = reqs.arc5.post
  process.env.DEPRECATED = true
  let verb = 'POST'
  let route = '/form'
  let handler = invoke({verb, route})
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
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5: post /form (multipart form data-encoded)', t => {
  t.plan(6)
  let request = reqs.arc5.postBinary
  process.env.DEPRECATED = true
  let verb = 'POST'
  let route = '/form'
  let handler = invoke({verb, route})
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
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5: put /form', t => {
  t.plan(6)
  let request = reqs.arc5.put
  process.env.DEPRECATED = true
  let verb = 'PUT'
  let route = '/form'
  let handler = invoke({verb, route})
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
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5: patch /form', t => {
  t.plan(6)
  let request = reqs.arc5.patch
  process.env.DEPRECATED = true
  let verb = 'PATCH'
  let route = '/form'
  let handler = invoke({verb, route})
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
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})

test('Architect v5: delete /form', t => {
  t.plan(6)
  let request = reqs.arc5.delete
  process.env.DEPRECATED = true
  let verb = 'DELETE'
  let route = '/form'
  let handler = invoke({verb, route})
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
  t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
  if (request.httpMethod === request.method)
    t.equal(req.httpMethod, req.method, match('req.method/httpMethod', req.method))
  t.equal(str(request.params), str(req.params), match('req.params', req.params))
  if (str(request.query) === str(req.query))
    t.equal(str(req.queryStringParameters), str(req.query), match('req.query/queryStringParameters', req.query))
  teardown()
})
