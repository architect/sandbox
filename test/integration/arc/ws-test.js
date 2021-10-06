let { join } = require('path')
let test = require('tape')
let aws = require('aws-sdk')
let http = require('http')
let Websocket = require('ws')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { credentials, port, run, startup, shutdown, makeSideChannel, wsUrl } = require('../../utils')
let { getPorts } = require(join(process.cwd(), 'src', 'lib', 'ports'))
let { _arcPort } = getPorts(port)

// AWS services to test
let endpoint = new aws.Endpoint(`http://localhost:${_arcPort}/_arc/ws`)
let httpOptions = { agent: new http.Agent() }
let apiGatewayManagementApi = new aws.ApiGatewayManagementApi({ endpoint, region: 'us-west-2', httpOptions, credentials })
let _events
let _ws
let ConnectionId

test('Set up env', async t => {
  t.plan(2)
  t.ok(sandbox, 'Got Sandbox')
  _events = await makeSideChannel()
  t.ok(_events, 'Got SideChannel')
})

test('Run internal Arc API Gateway Management service tests', t => {
  run(runTests, t)
  t.end()
})

test(`Shut down sidechannel`, async t => {
  t.plan(1)
  await _events.shutdown()
  t.pass('Side channel shut down')
})

function runTests (runType, t) {
  let mode = `[Internal Arc API Gateway Management services / ${runType}]`

  t.test(`${mode} Start Sandbox ('normal' mock app)`, t => {
    startup[runType](t, 'normal')
    _events.reset()
  })

  t.test(`${mode} connect websocket`, async () => {
    t.plan(1)
    _ws = new Websocket(wsUrl)
    await new Promise((resolve) => _ws.on('open', resolve))
    let connectEvent = await _events.nextRequest()

    ConnectionId = connectEvent.event.requestContext.connectionId

    t.ok(ConnectionId, `Connected ConnectionId ${ConnectionId}`)
  })

  t.test(`${mode} getConnection info about connection`, async t => {
    t.plan(2)
    const beforeConnect = new Date()
    let info = await apiGatewayManagementApi.getConnection({ ConnectionId }).promise()
    t.ok(info.ConnectedAt >= beforeConnect, 'Connection info matches')
    t.ok(info.ConnectedAt <= new Date(), 'Connection info matches')
  })

  t.test(`${mode} postToConnection messages to a websocket`, async t => {
    t.plan(1)
    let Data = JSON.stringify({ message: 'hi' })
    let messagePromise = new Promise(resolve => _ws.on('message', resolve))
    await apiGatewayManagementApi.postToConnection({ ConnectionId, Data }).promise()
    const message = (await messagePromise).toString()
    console.log({ message })
    t.equals(message, Data, 'Got message')
  })

  t.test(`${mode} Disconnect a socket`, async t => {
    t.plan(1)
    let closePromise = new Promise(resolve => _ws.on('close', resolve))
    await apiGatewayManagementApi.deleteConnection({ ConnectionId }).promise()
    await closePromise
    t.pass('connection closed')
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}

