let test = require('tape')
let proxyquire = require('proxyquire')
let { arc8 } = require('../ws-req-fixtures')
let { arc6 } = require('../http-req-fixtures')

function lambdaStub (params, callback) {
  callback(null, params)
}

let invoke = proxyquire('../../../../../src/http/invoke-ws', {
  '../../invoke-lambda': lambdaStub
})
let str = i => JSON.stringify(i)
let match = (copy, item) => `${copy} matches: ${str(item)}`

let customizeWSRequest = (request, { connectionId }) => {
  return {
    ...arc8,
    requestContext: {
      ...arc8.requestContext,
      connectionId
    }
  }
}

test('WebSocket connect Event', t => {
  t.plan(2)
  let connectionId = 'much-unique-uuid'
  let params = {
    req: {},
    requestContext: { connectionId },
    body: undefined
  }
  invoke(params, function compare (err, result) {
    if (err) { /* linter */ }
    let { event } = result
    t.deepEqual(event, customizeWSRequest(arc8.connect, { connectionId }))
  })
})

test('Internal WebSocket events: body (WS message), no req', t => {
  t.plan(6)
  let connectionId = 'much-unique-uuid'
  let body = JSON.stringify({ message: 'howdy' })
  let params = {
    lambda: { src: 'src/ws/default' }, // not a real action
    body,
    requestContext: { connectionId },
  }
  invoke(params, function compare (err, result) {
    if (err) { /* linter */ }
    let { lambda, event: req } = result
    t.deepEqual(params.lambda, lambda, match('Lambda', lambda))
    t.equal(connectionId, req.requestContext.connectionId, match('connectionId', req.requestContext.connectionId))
    t.equal(body, req.body, match('body', req.body))
    t.notOk(req.isBase64Encoded, 'isBase64Encoded set to false')
    t.notOk(req.headers, 'req.headers not present')
    t.notOk(req.query, 'req.query not present')
  })
})

test('WebSocket connect / disconnect event: get /', t => {
  t.plan(4)
  let connectionId = 'much-unique-uuid'
  let request = arc6.getIndex
  request.url = 'localhost'
  let params = {
    body: undefined,
    requestContext: { connectionId },
    req: request
  }
  invoke(params, function compare (err, result) {
    if (err) { /* linter */ }
    let { lambda, event: req } = result
    t.deepEqual(params.lambda, lambda, match('Lambda', lambda))
    t.equal(connectionId, req.requestContext.connectionId, match('connectionId', req.requestContext.connectionId))
    t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
    t.notOk(req.isBase64Encoded, 'isBase64Encoded set to false')
  })
})

test('WebSocket connect / disconnect event: get /?whats=up', t => {
  t.plan(4)
  let connectionId = 'much-unique-uuid'
  let request = arc6.getIndex // gonna have to manually add query string
  request.url = 'localhost/?whats=up'
  let params = {
    lambda: { src: 'src/ws/connect' }, // not a real action
    requestContext: { connectionId },
    req: request
  }
  invoke(params, function compare (err, result) {
    if (err) { /* linter */ }
    let { lambda, event: req } = result
    t.deepEqual(params.lambda, lambda, match('Lambda', lambda))
    t.equal(connectionId, req.requestContext.connectionId, match('connectionId', req.requestContext.connectionId))
    t.equal(str(request.headers), str(req.headers), match(`req.headers`, req.headers))
    t.notOk(req.isBase64Encoded, 'isBase64Encoded set to false')
  })
})
