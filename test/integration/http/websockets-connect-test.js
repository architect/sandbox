let { join } = require('path')
let test = require('tape')
let Websocket = require('ws')
let { makeSideChannel } = require('./_utils')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let mock = join(process.cwd(), 'test', 'mock')
let sandboxPort = Number(process.env.PORT || 3333)
let url = `ws://localhost:${sandboxPort}`

let expectFunctionBasics = (t, expectedFunctionName) => websocketMessage => {
  let { functionName, event } = JSON.parse(websocketMessage)
  t.equal(functionName, expectedFunctionName, `Invoked correct function`)
  t.equal(event.requestContext.routeKey, `$${expectedFunctionName}`, `Included correct routeKey`)
  t.equal(event.isBase64Encoded, false, `isBase64Encoded is false`)
}

let expectRequestContext = (t, expectedContext = {}) => websocketMessage => {
  let { event } = JSON.parse(websocketMessage)
  let { requestContext } = event
  t.ok(requestContext.connectionId, 'Got requestContext with connectionId')
  t.ok(requestContext.requestId, 'Got requestContext with requestId')
  t.equal(requestContext.messageDirection, 'IN', 'Got requestContext correct messageDirection')

  for (let [ key, value ] of Object.entries(expectedContext)) {
    t.deepEquals(requestContext[key], value, `Expected requestContext.${key} to match expected input`)
  }
}

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got sandbox')
})


test('[WebSockets] Start Sandbox', t => {
  t.plan(4)
  delete process.env.ARC_QUIET
  sandbox.start({ cwd: join(mock, 'websocket-connect'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[WebSockets] Connect, and Disconnect', async t => {
  t.plan(21)
  const events = await makeSideChannel()

  let ws = new Websocket(url)
  const wsOpenPromise = new Promise(resolve => ws.on('open', resolve))
  const wsClosePromise = new Promise(resolve => ws.on('close', resolve))
  ws.on('error', err => { throw err })

  await wsOpenPromise
  const connectionEvent = await events.nextRequest()
  expectFunctionBasics(t, 'connect')(connectionEvent)
  expectRequestContext(t, { eventType: 'CONNECT' })(connectionEvent)

  ws.send(JSON.stringify({ message: 'hi' }))
  const messageEvent = await events.nextRequest()
  expectFunctionBasics(t, 'default')(messageEvent)
  expectRequestContext(t, { eventType: 'MESSAGE' })(messageEvent)

  ws.close()
  await wsClosePromise

  const disconnectEvent = await events.nextRequest()
  expectFunctionBasics(t, 'disconnect')(disconnectEvent)
  expectRequestContext(t, { eventType: 'DISCONNECT' })(disconnectEvent)
  await events.shutdown()
  await sandbox.end()
})
