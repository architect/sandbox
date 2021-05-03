let { join } = require('path')
let test = require('tape')
let websocket = require('ws')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { data, shutdown } = require('./_utils')

let mock = join(__dirname, '..', '..', 'mock')
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

function connect (t, payload) {
  t.pass('WebSocket connected')
  ws.send(JSON.stringify(payload))
}

function message (t, m) {
  let message = JSON.parse(m)
  t.ok(message, 'Received message payload from WS Lambda confirming send')
  console.log(`WebSocket message:`, message)

  let { event, req } = message
  t.ok(req.requestContext.connectionId, 'Got request context with connectionId')

  let body = JSON.parse(req.body)
  t.equal(event, body.expect, `Invoked correct WebSocket Lambda / action: ${event}`)
  t.equal(body.hi, data.hi, 'Got body payload')
  t.equal(req.isBase64Encoded, false, 'Got isBase64Encoded false')

  close(t)
}


test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got sandbox')
})


test('[WebSockets] Start Sandbox', t => {
  t.plan(4)
  process.chdir(join(mock, 'normal'))
  delete process.env.ARC_QUIET
  sandbox.start({ /* quiet: true */ }, function (err, result) {
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
  t.plan(9)
  setup(t)
  let payload = {
    ...data,
    expect: 'default'
  }
  ws.on('open', connect.bind({}, t, payload))
  ws.on('message', message.bind({}, t))
})

test('[WebSockets] Connect, send payloads (falls back to default), disconnect', t => {
  t.plan(9)
  setup(t)
  let payload = {
    action: 'some-random-action',
    ...data,
    expect: 'default'
  }
  ws.on('open', connect.bind({}, t, payload))
  ws.on('message', message.bind({}, t))
})

test('[WebSockets] Connect, send non json payload (falls back to default), disconnect', t => {
  t.plan(9)
  setup(t)
  const body = 'foobar'
  ws.on('open', () => {
    t.pass('WebSocket connected')
    ws.send(body)
  })
  ws.on('message', m => {
    let message = JSON.parse(m)
    t.ok(message, 'Received message payload from WS Lambda confirming send')
    let { event, req } = message
    t.ok(req.requestContext.connectionId, 'Got request context with connectionId')

    t.equal(event, 'default', `Invoked correct WebSocket Lambda / action: ${event}`)
    t.equal(req.body, body, 'Got body payload')
    t.equal(req.isBase64Encoded, false, 'Got isBase64Encoded false')

    close(t)
  })
})

test('[WebSockets] Connect, send payloads (user action), disconnect', t => {
  t.plan(9)
  setup(t)
  let payload = {
    action: 'hello',
    ...data,
    expect: 'hello'
  }
  ws.on('open', connect.bind({}, t, payload))
  ws.on('message', message.bind({}, t))
})

test('[WebSockets] Connect, send payloads (custom filepath), disconnect', t => {
  t.plan(9)
  setup(t)
  let payload = {
    action: 'custom',
    ...data,
    expect: 'custom'
  }
  ws.on('open', connect.bind({}, t, payload))
  ws.on('message', message.bind({}, t))
})

test('[WebSockets] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})
