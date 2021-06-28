let { join } = require('path')
let test = require('tape')
let websocket = require('ws')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { shutdown } = require('./_utils')

let mock = join(process.cwd(), 'test', 'mock')
let url = `ws://localhost:${process.env.PORT || 3333}`
let wsErr = err => { throw err }
let ws // Reused below

// Lots of test fns calling other test fns in this test
function setup (t) {
  if (ws) throw Error('Should not have found WebSocket, test is not clean')
  ws = new websocket(url)
  ws.on('error', wsErr)
  t.ok(ws, 'WebSocket set up')
}

function teardown (t) {
  ws = undefined
  t.notOk(ws, 'WebSocket reset')
}

function close (t) {
  ws.on('close', () => {
    t.pass('WebSocket closed')
    teardown(t)
  })
  ws.close()
}

let sendOnConnect = (t, payload) => () => {
  t.pass('WebSocket connected')
  ws.send(JSON.stringify(payload))
}

let expectFunctionBasics = (t, expectedFunctionName) => websocketMessage => {
  let { functionName, event } = JSON.parse(websocketMessage)
  console.log(`WebSocket message:`, { functionName, event })
  t.equal(functionName, expectedFunctionName, `Invoked correct function`)
  t.equal(event.requestContext.routeKey, `$${expectedFunctionName}`, `Included correct routeKey`)
  t.equal(event.isBase64Encoded, false, `isBase64Encoded is false`)
}

let expectPayload = (t, expectedBody) => websocketMessage => {
  let { event } = JSON.parse(websocketMessage)
  let body = JSON.parse(event.body)
  if (typeof body !== 'object') {
    t.equal(body, expectedBody, 'Expected non object body matched lambda input')
    return
  }
  for (let [ key, value ] of Object.entries(expectedBody)) {
    t.deepEquals(body[key], value, `Expected body.${key} to match lambda input`)
  }
}

let expectRequestContext = (t, expectedContext = {}) => websocketMessage => {
  let { event } = JSON.parse(websocketMessage)
  let { requestContext } = event
  console.log(event)
  t.ok(requestContext.connectionId, 'Got requestContext with connectionId')
  t.ok(requestContext.messageId, 'Got requestContext with messageId')
  t.ok(requestContext.requestId, 'Got requestContext with requestId')
  t.equal(requestContext.messageDirection, 'IN', 'Got requestContext correct messageDirection')

  for (let [ key, value ] of Object.entries(expectedContext)) {
    t.deepEquals(requestContext[key], value, `Expected requestContext.${key} to match expected input`)
  }
}

let closeAfterMessage = (t) => () => {
  close(t)
}

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got sandbox')
})


test('[WebSockets] Start Sandbox', t => {
  t.plan(4)
  delete process.env.ARC_QUIET
  sandbox.start({ cwd: join(mock, 'normal'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[WebSockets] Connect, send payloads (default), disconnect', t => {
  t.plan(13)
  setup(t)
  let payload = {
    message: 'hi there!',
  }
  let requestContext = {
    eventType: 'MESSAGE',
  }
  ws.on('open', sendOnConnect(t, payload))
  ws.on('message', expectFunctionBasics(t, 'default'))
  ws.on('message', expectPayload(t, payload))
  ws.on('message', expectRequestContext(t, requestContext))
  ws.on('message', closeAfterMessage(t))
})

test('[WebSockets] Connect, send payloads (falls back to default), disconnect', t => {
  t.plan(13)
  setup(t)
  let payload = {
    action: 'some-random-action',
    message: 'how is it going?',
  }
  ws.on('open', sendOnConnect(t, payload))
  ws.on('message', expectFunctionBasics(t, 'default'))
  ws.on('message', expectPayload(t, payload))
  ws.on('message', expectRequestContext(t))
  ws.on('message', closeAfterMessage(t))
})

test('[WebSockets] Connect, send non json payload (falls back to default), disconnect', t => {
  t.plan(8)
  setup(t)
  let payload = 'foobar'
  ws.on('open', sendOnConnect(t, payload))
  ws.on('message', expectFunctionBasics(t, 'default'))
  ws.on('message', expectPayload(t, payload))
  ws.on('message', closeAfterMessage(t))
})

test('[WebSockets] Connect, send payloads (custom action), disconnect', t => {
  t.plan(9)
  setup(t)
  let payload = {
    action: 'hello',
    message: 'hello'
  }
  ws.on('open', sendOnConnect(t, payload))
  ws.on('message', expectFunctionBasics(t, 'hello'))
  ws.on('message', expectPayload(t, payload))
  ws.on('message', closeAfterMessage(t))
})

test('[WebSockets] Connect, send payloads (custom filepath), disconnect', t => {
  t.plan(9)
  setup(t)
  let payload = {
    action: 'custom',
    message: 'I know what you did last summer'
  }
  ws.on('open', sendOnConnect(t, payload))
  ws.on('message', expectFunctionBasics(t, 'custom'))
  ws.on('message', expectPayload(t, payload))
  ws.on('message', closeAfterMessage(t))
})

test('[WebSockets] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})
