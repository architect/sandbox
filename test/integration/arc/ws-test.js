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

test('Set up env', async t => {
  t.plan(1)
  t.ok(sandbox, 'Got Sandbox')
})

test('Run internal Arc API Gateway Management service tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  let mode = `[Internal Arc API Gateway Management services / ${runType}]`
  let _events
  let _ws
  let ConnectionId

  // AWS services to test
  let endpoint = new aws.Endpoint(`http://localhost:${_arcPort}/_arc/ws`)
  let httpOptions = { agent: new http.Agent() }
  let apiGatewayManagementApi = new aws.ApiGatewayManagementApi({ endpoint, region: 'us-west-2', httpOptions, credentials })

  let connectWebSocket = async () => {
    if (_ws) throw Error('Only one websocket can be connected at a time, test is not clean')
    _ws = new Websocket(wsUrl)
    _ws.on('error', err => { throw err })
    _ws.on('close', () => {
      _ws = undefined
      console.log('WebSocket disconnected')
    })
    await new Promise((resolve) => _ws.on('open', resolve))
    console.log('WebSocket connected')
    return _ws
  }

  let nextEvent = async t => {
    let request = await _events.nextRequest()
    t.pass('Got next WebSocket request')
    return request
  }

  let startupAndConnect = async () => {
    _events.reset()
    await connectWebSocket()
  }

  t.test(`${mode} Start Sandbox ('normal' mock app)`, t => {
    startup[runType](t, 'normal')
  })

  t.test('Start side channel', async t => {
    t.plan(1)
    _events = await makeSideChannel()
    t.ok(_events, 'Setup side channel')
  })

  t.test(`${mode} getConnection info about connection`, async t => {
    t.plan(3)
    await startupAndConnect()

    let connectionEvent = await nextEvent(t)
    ConnectionId = connectionEvent.event.requestContext.connectionId
    t.ok(ConnectionId, `Got requestContext with connectionId: ${ConnectionId}`)

    let connection = await apiGatewayManagementApi.getConnection({ ConnectionId }).promise()
    t.ok(new Date(Date.parse(connection.ConnectedAt)) <= new Date(), `Got back connectedAt string: ${connection.ConnectedAt}`)
  })

  t.test(`${mode} postToConnection messages to a websocket`, async t => {
    t.plan(1)
    let Data = JSON.stringify({ message: 'hi' })
    let messagePromise = new Promise(resolve => _ws.once('message', resolve))
    await apiGatewayManagementApi.postToConnection({ ConnectionId, Data }).promise()
    const message = (await messagePromise).toString()
    // console.log({ message })
    t.equals(message, Data, 'Got message')
  })

  t.test(`${mode} Disconnect a socket`, async t => {
    t.plan(3)
    let closePromise = new Promise(resolve => _ws.once('close', resolve))
    await apiGatewayManagementApi.deleteConnection({ ConnectionId }).promise()
    await closePromise
    t.notOk(_ws, 'WebSocket closed')
    try {
      await apiGatewayManagementApi.getConnection({ ConnectionId }).promise()
      t.fail('getConnection should have thrown')
    }
    catch (error) {
      t.equals(error.message, '410', 'Error message matches')
      t.equals(error.code, 'GoneException', 'Error Code Matches')
    }
  })

  t.test(`${mode} Shut down sidechannel`, async t => {
    t.plan(1)
    await _events.shutdown()
    t.pass('Side channel shut down')
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
