let { join } = require('path')
let test = require('tape')
let Websocket = require('ws')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { makeSideChannel } = require('./_utils')

let mock = join(process.cwd(), 'test', 'mock')
let url = `ws://localhost:${process.env.PORT || 3333}`
let _ws

let connectWebSocket = async () => {
  if (_ws) throw Error('Only one websocket can be connected at a time, test is not clean')
  _ws = new Websocket(url)
  _ws.on('error', err => { throw err })
  _ws.on('close', () => {
    _ws = undefined
    console.log('WebSocket disconnected')
  })
  await new Promise((resolve) => _ws.on('open', resolve))
  console.log('WebSocket connected')
  return _ws
}

let closeWebSocket = async (t) => {
  let closePromise = new Promise((resolve) => _ws.on('close', resolve))
  _ws.close()
  await closePromise
  t.notOk(_ws, 'WebSocket closed')
}

let sendMessage = payload => {
  _ws.send(JSON.stringify(payload))
}

let expectFunctionBasics = (t, websocketMessage, expectedFunctionName) => {
  let { functionName, event } = websocketMessage
  t.equal(functionName, expectedFunctionName, `[${expectedFunctionName}] Invoked correct function`)
  t.equal(event.requestContext.routeKey, `$${expectedFunctionName}`, `[${expectedFunctionName}] Included correct routeKey`)
  t.equal(event.isBase64Encoded, false, `[${expectedFunctionName}] isBase64Encoded is false`)
}

let expectPayload = (t, websocketMessage, expectedBody) => {
  let { functionName, event: { body } } = websocketMessage
  if (body === undefined || expectedBody === undefined) {
    t.equal(body, expectedBody, `[${functionName}] Expected undefined body`)
    return
  }

  let parsedBody = JSON.parse(body)
  if (typeof parsedBody !== 'object') {
    t.equal(parsedBody, expectedBody, `[${functionName}] Expected non object body matched lambda input`)
    return
  }

  // shallow check event object which is fine for our purposes and will throw if we nest objects
  for (let [ key, value ] of Object.entries(expectedBody)) {
    t.deepEquals(parsedBody[key], value, `[${functionName}] Expected body.${key} to match lambda input`)
  }
}

let expectRequestContext = (t, websocketMessage, expectedContext = {}) => {
  let { functionName, event: { requestContext } } = websocketMessage
  t.ok(requestContext.connectionId, `[${functionName}]  Got requestContext with connectionId`)
  t.ok(requestContext.requestId, `[${functionName}] Got requestContext with requestId`)
  t.equal(requestContext.messageDirection, 'IN', `[${functionName}] Got requestContext correct messageDirection`)

  for (let [ key, value ] of Object.entries(expectedContext)) {
    t.deepEquals(requestContext[key], value, `[${functionName}] Expected requestContext.${key} to match expected input`)
  }
}

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got sandbox')
})

test('[WebSockets] Start Sandbox', t => {
  t.plan(4)
  delete process.env.ARC_QUIET
  sandbox.start({ cwd: join(mock, 'normal'), quiet: true }, function (err, result) {
    if (err) {
      t.fail(err)
    }
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[WebSockets] Connect, send payloads (default), disconnect', async t => {
  t.plan(30)
  let events = await makeSideChannel()
  await connectWebSocket()

  let connectionEvent = await events.nextRequest(t)
  expectFunctionBasics(t, connectionEvent, 'connect')
  expectRequestContext(t, connectionEvent, { eventType: 'CONNECT' })
  expectPayload(t, connectionEvent, undefined)

  sendMessage({ message: 'hi' })
  let messageEvent = await events.nextRequest(t)
  expectFunctionBasics(t, messageEvent, 'default')
  expectRequestContext(t, messageEvent, { eventType: 'MESSAGE' })
  t.ok(messageEvent.event.requestContext.messageId, 'Got requestContext with messageId')
  expectPayload(t, messageEvent, { message: 'hi' })

  await closeWebSocket(t)

  let disconnectEvent = await events.nextRequest(t)
  expectFunctionBasics(t, disconnectEvent, 'disconnect')
  expectRequestContext(t, disconnectEvent, { eventType: 'DISCONNECT' })
  expectPayload(t, disconnectEvent, undefined)

  await events.shutdown(t)
})

test('[WebSockets] Connect, send payloads (falls back to default), disconnect', async t => {
  t.plan(10)
  let events = await makeSideChannel()

  await connectWebSocket()
  await events.nextRequest(t) // ignore connect event

  let payload = {
    action: 'some-random-action',
    message: 'how is it going?',
  }
  sendMessage(payload)

  let messageEvent = await events.nextRequest(t)
  expectFunctionBasics(t, messageEvent, 'default')
  expectPayload(t, messageEvent, payload)

  await closeWebSocket(t)
  await events.nextRequest(t) // ignore disconnect event but wait for it so the lambda doesn't error
  await events.shutdown(t)
})

test('[WebSockets] Connect, send non json payload (falls back to default), disconnect', async t => {
  t.plan(9)
  let events = await makeSideChannel()

  await connectWebSocket()
  await events.nextRequest(t) // ignore connect event

  let payload = 'foobar'
  sendMessage(payload)

  let messageEvent = await events.nextRequest(t)
  expectFunctionBasics(t, messageEvent, 'default')
  expectPayload(t, messageEvent, payload)

  await closeWebSocket(t)
  await events.nextRequest(t) // ignore disconnect event but wait for it so the lambda doesn't error
  await events.shutdown(t)
})

test('[WebSockets] Connect, send payloads (custom action), disconnect', async t => {
  t.plan(10)
  let events = await makeSideChannel()

  await connectWebSocket()
  await events.nextRequest(t) // ignore connect event

  let payload = {
    action: 'hello',
    message: 'how is it going?',
  }
  sendMessage(payload)

  let messageEvent = await events.nextRequest(t)
  expectFunctionBasics(t, messageEvent, 'hello')
  expectPayload(t, messageEvent, payload)

  await closeWebSocket(t)
  await events.nextRequest(t) // ignore disconnect event but wait for it so the lambda doesn't error
  await events.shutdown(t)
})

test('[WebSockets] Connect, send payloads (custom filepath), disconnect', async t => {
  t.plan(10)
  let events = await makeSideChannel()

  await connectWebSocket()
  await events.nextRequest(t) // ignore connect event

  let payload = {
    action: 'custom',
    message: 'how is it going?',
  }
  sendMessage(payload)

  let messageEvent = await events.nextRequest(t)
  expectFunctionBasics(t, messageEvent, 'custom')
  expectPayload(t, messageEvent, payload)

  await closeWebSocket(t)
  await events.nextRequest(t) // ignore disconnect event but wait for it so the lambda doesn't error
  await events.shutdown(t)
})

test('[WebSockets] Shut down Sandbox', async t => {
  t.plan(1)
  await sandbox.end()
  t.ok(true, 'Sandbox shutdown')
})
