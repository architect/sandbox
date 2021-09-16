let _binaryHandler = require('../../../../../src/http/middleware/_binary-handler')
let { EventEmitter: events } = require('events')
let { Readable } = require('stream')
let test = require('tape')
let dec = i => new Buffer.from(i, 'base64').toString()

test('Set up env', t => {
  t.plan(1)
  t.ok(_binaryHandler, 'Got binary handler')
})

test('Arc v6 (HTTP): base64 encode body & flag', t => {
  t.plan(3)
  let body = 'hi there'
  let e = new events()
  let stream = new Readable()
  stream.headers = { 'content-length': '8' }
  stream.body = ''
  stream.push(body)
  stream.push(null)
  let binaryHandler = _binaryHandler.bind({}, { apiType: 'http' })
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body
    t.ok(result, 'Got base64 body back')
    t.equal(dec(result), body, 'Decoded body matches request')
    t.ok(stream.isBase64Encoded, 'isBase64Encoded param set')
  })
})

test('Arc v6 (HTTP): do not encode JSON', t => {
  t.plan(3)
  let body = 'hi there'
  let e = new events()
  let stream = new Readable()
  stream.headers = { 'content-type': 'application/json', 'content-length': '8' }
  stream.body = ''
  stream.push(body)
  stream.push(null)
  let binaryHandler = _binaryHandler.bind({}, { apiType: 'http' })
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body
    t.ok(result, 'Got body back')
    t.equal(result, body, 'Body matches request')
    t.equal(stream.isBase64Encoded, false, 'isBase64Encoded param not set')
  })
})

test('Arc v6 (HTTP): do not encode vendored JSON', t => {
  t.plan(3)
  let body = 'hi there'
  let e = new events()
  let stream = new Readable()
  stream.headers = { 'content-type': 'application/ld+json', 'content-length': '8' }
  stream.body = ''
  stream.push(body)
  stream.push(null)
  let binaryHandler = _binaryHandler.bind({}, { apiType: 'http' })
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body
    t.ok(result, 'Got body back')
    t.equal(result, body, 'Body matches request')
    t.equal(stream.isBase64Encoded, false, 'isBase64Encoded param not set')
  })
})

test('Arc v6 (REST): base64 encode body & flag', t => {
  t.plan(3)
  let body = 'hi there'
  let e = new events()
  let stream = new Readable()
  stream.headers = { 'content-length': '8' }
  stream.body = ''
  stream.push(body)
  stream.push(null)
  let binaryHandler = _binaryHandler.bind({}, {})
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body
    t.ok(result, 'Got base64 body back')
    t.equal(dec(result), body, 'Decoded body matches request')
    t.ok(stream.isBase64Encoded, 'isBase64Encoded param set')
  })
})

test('Arc v6 (REST): handle empty body', t => {
  t.plan(3)
  let e = new events()
  let stream = new Readable()
  stream.headers = {}
  stream.body = ''
  stream.push(null)
  let binaryHandler = _binaryHandler.bind({}, {})
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body
    t.ok(result, 'Got body back')
    t.notOk(Object.getOwnPropertyNames(stream.body).length, 'Body object is empty')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
  })
})

test('Skip if missing content-length header', t => {
  t.plan(3)
  let e = new events()
  let stream = new Readable()
  stream.headers = {}
  stream.body = 'hi there'
  stream.push(null)
  let binaryHandler = _binaryHandler.bind({}, {})
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body.base64
    t.notOk(result, 'Did not get base64 body object back')
    t.notOk(Object.getOwnPropertyNames(stream.body).length, 'Body object is empty')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
  })
})

test('Skip if content-length is 0', t => {
  t.plan(3)
  let e = new events()
  let stream = new Readable()
  stream.headers = { 'content-length': '0' }
  stream.body = 'hi there'
  stream.push(null)
  let binaryHandler = _binaryHandler.bind({}, {})
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body.base64
    t.notOk(result, 'Did not get base64 body object back')
    t.notOk(Object.getOwnPropertyNames(stream.body).length, 'Body object is empty')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
  })
})

test('Skip if posting to /__arc (WebSocket endpoint)', t => {
  t.plan(3)
  let e = new events()
  let stream = new Readable()
  stream.headers = { 'content-length': '8' }
  stream.body = 'hi there'
  stream.url = '/___'
  stream.push(null)
  let binaryHandler = _binaryHandler.bind({}, {})
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body.base64
    t.notOk(result, 'Did not get base64 body object back')
    t.notOk(Object.getOwnPropertyNames(stream.body).length, 'Body object is empty')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
  })
})
