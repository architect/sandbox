let test = require('tape')
let proxyquire = require('proxyquire')
let { EventEmitter } = require('events')

let connectionId = 'abcdefg12345'

let makeFakeSocket = () => {
  let socket = new EventEmitter()
  socket.send = function send (body, cb) {
    pool.didSend = body
    cb()
  }
  socket.close = function close () {
    pool.closed = true
    this.emit('close')
  }
  return socket
}

let makePool = () => ({
  getConnection (id){
    console.log({ id, ws: pool.data[id]?.ws })
    return pool.data[id]?.ws
  },
  getConnectedAt (id){
    console.log({ id, connectedAt: pool.data[id]?.connectedAt })
    return pool.data[id]?.connectedAt
  },
  data: {
    [connectionId]: {
      ws: makeFakeSocket(),
      connectedAt: Date.now(),
    },
  },
  didSend: null,
  closed: false,
})

let pool = makePool()

let ws = proxyquire('../../../../../src/arc/_ws', {
  '../../http/register-websocket/pool': pool
})

let req
let res
let resBody
function reset (t) {
  pool = makePool()
  resBody = null
  req = new EventEmitter()
  req.url = `/_arc/ws/@connections/${connectionId}`
  res = {
    end: (body) => {
      resBody = body
      t.pass('HTTP response end invoked')
    },
    setHeader: () => {}
  }
}

test('ws module should return 404 for an unknown connectionId', t => {
  t.plan(2)
  reset(t)
  req.method = 'POST'
  req.url = `/_arc/ws/@connections/nobodyHome`
  ws({ }, req, res)
  t.equals(res.statusCode, 410, 'response statusCode not set to 404')
})

test('ws module GET should return JSON containing connection information', t => {
  t.plan(3)
  reset(t)
  req.method = 'GET'
  ws({}, req, res)
  t.equals(res.statusCode, 200, 'response statusCode set to 200')
  let body = JSON.parse(resBody)
  t.deepEqual(body, {
    connectedAt: new Date(pool.getConnectedAt(connectionId)).toISOString()
  }, 'Gets Connected At')
})

test('ws module delete should close the connection', t => {
  t.plan(3)
  reset(t)
  req.method = 'DELETE'
  ws({}, req, res)
  t.equals(res.statusCode, 200, 'response statusCode set to 200')
  t.true(pool.closed, 'closed the connection')
})

test('ws module POST should send data to the connection', t => {
  t.plan(3)
  reset(t)
  req.method = 'POST'
  let body = JSON.stringify({ message: 'this is for all you connections out there!' })
  ws({ body }, req, res)
  t.equals(res.statusCode, 200, 'response statusCode set to 200')
  t.equals(pool.didSend, body, 'Gets Connected At')
})
