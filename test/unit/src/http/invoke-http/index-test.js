let test = require('tape')
let proxyquire = require('proxyquire')
let { join } = require('path')
let sut = join(process.cwd(), 'src', 'http', 'invoke-http')

let invokeResult, headers = {}, body
let lambdaStub = (params, callback) => callback(null, invokeResult)
let invoke = proxyquire(sut, {
  '../../invoke-lambda': lambdaStub
})
let { headers: _headers } = require('@architect/req-res-fixtures').http.req

let inventory = { inv: { _project: { preferences: null } } }

let url = i => `http://localhost:6666${i ? i : ''}`
let ports = { _arc: 2222 }
let str = i => JSON.stringify(i)

let response = {
  getHeaders: () => headers,
  setHeader: (header, value) => headers[header] = value,
  end: returned => body = returned,
}

function reset () {
  invokeResult = undefined
  headers = {}
  body = undefined
  inventory = { inv: { _project: { preferences: null } } }
}

let input = {
  url: url(),
  body: {},
  headers: _headers,
  params: {}
}

test('Live reload passes through', t => {
  t.plan(4)
  let params, handler
  let lambda = { method: 'GET', route: '/' }

  params = { lambda, apiType: 'http', inventory, ports }
  handler = invoke(params)
  invokeResult = { ok: true }
  handler(input, response)
  t.equal(body, str(invokeResult), 'JSON body is unmutated')
  reset()

  inventory.inv._project.preferences = { sandbox: { livereload: true } }
  params = { lambda, apiType: 'http', inventory, ports }
  handler = invoke(params)
  invokeResult = { ok: true }
  handler(input, response)
  t.equal(body, str(invokeResult), 'JSON body is unmutated with live reload enabled')
  reset()

  params = { lambda, apiType: 'http', inventory, ports }
  handler = invoke(params)
  invokeResult = {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: 'hi'
  }
  handler(input, response)
  t.equal(body, invokeResult.body, 'HTML body is unmutated')
  reset()

  inventory.inv._project.preferences = { sandbox: { livereload: true } }
  params = { lambda, apiType: 'http', inventory, ports }
  handler = invoke(params)
  invokeResult = {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: 'hi'
  }
  handler(input, response)
  t.equal(body, invokeResult.body, 'HTML body is unmutated with live reload enabled')
  reset()
})

test('Live reload injects script when enabled', t => {
  t.plan(10)
  let params, handler
  let lambda = { method: 'GET', route: '/' }

  inventory.inv._project.preferences = { sandbox: { livereload: true } }
  params = { lambda, apiType: 'http', inventory, ports }
  handler = invoke(params)
  invokeResult = {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: '<head></head>henlo'
  }
  handler(input, response)
  t.notEqual(body, invokeResult.body, 'HTML body mutated with live reload enabled')
  t.deepEqual(headers, invokeResult.headers, 'Headers are unmutated')
  t.match(body, /<script>/, 'Added script tag')
  t.match(body, /ws:\/\/localhost:2222/, 'Script tag includes _arc WS URL')
  t.match(body, />henlo/, 'Retained original body')
  reset()

  inventory.inv._project.preferences = { sandbox: { livereload: true } }
  params = { lambda, apiType: 'http', inventory, ports }
  handler = invoke(params)
  invokeResult = {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: Buffer.from('<head></head>henlo').toString('base64'),
    isBase64Encoded: true,
  }
  handler(input, response)
  t.notEqual(body, invokeResult.body, 'HTML body mutated with live reload enabled')
  t.deepEqual(headers, invokeResult.headers, 'Headers are unmutated')
  t.match(body, /<script>/, 'Added script tag')
  t.match(body, /ws:\/\/localhost:2222/, 'Script tag includes _arc WS URL')
  t.match(body, />henlo/, 'Retained original body')
  reset()
})
