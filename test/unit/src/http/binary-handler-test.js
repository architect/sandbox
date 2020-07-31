let binaryHandler = require('../../../../src/http/binary-handler')
let { EventEmitter: events } = require('events')
let { Readable } = require('stream')
let test = require('tape')
let dec = i => new Buffer.from(i, 'base64').toString()

test('Set up env', t => {
  t.plan(1)
  t.ok(binaryHandler, 'Got binary handler')
})

function teardown () {
  delete process.env.ARC_API_TYPE
  delete process.env.DEPRECATED
}

test('Arc v6 (HTTP): base64 encode body & flag', t => {
  t.plan(3)
  process.env.ARC_API_TYPE = 'http'
  let body = 'hi there'
  let e = new events()
  let stream = new Readable()
  stream.headers = { 'content-length': '8' }
  stream.body = ''
  stream.push(body)
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body
    t.ok(result, 'Got base64 body back')
    t.equal(dec(result), body, 'Decoded body matches request')
    t.ok(stream.isBase64Encoded, 'isBase64Encoded param set')
  })
  teardown()
})

test('Arc v6 (HTTP): do not encode JSON', t => {
  t.plan(3)
  process.env.ARC_API_TYPE = 'http'
  let body = 'hi there'
  let e = new events()
  let stream = new Readable()
  stream.headers = { 'content-type': 'application/json', 'content-length': '8' }
  stream.body = ''
  stream.push(body)
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body
    t.ok(result, 'Got body back')
    t.equal(result, body, 'Body matches request')
    t.equal(stream.isBase64Encoded, false, 'isBase64Encoded param not set')
  })
  teardown()
})

test('Arc v6 (HTTP): do not encode vendored JSON', t => {
  t.plan(3)
  process.env.ARC_API_TYPE = 'http'
  let body = 'hi there'
  let e = new events()
  let stream = new Readable()
  stream.headers = { 'content-type': 'application/ld+json', 'content-length': '8' }
  stream.body = ''
  stream.push(body)
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body
    t.ok(result, 'Got body back')
    t.equal(result, body, 'Body matches request')
    t.equal(stream.isBase64Encoded, false, 'isBase64Encoded param not set')
  })
  teardown()
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
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body
    t.ok(result, 'Got base64 body back')
    t.equal(dec(result), body, 'Decoded body matches request')
    t.ok(stream.isBase64Encoded, 'isBase64Encoded param set')
  })
  teardown()
})

test('Arc v6 (REST): handle empty body', t => {
  t.plan(3)
  let e = new events()
  let stream = new Readable()
  stream.headers = {}
  stream.body = ''
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body
    t.ok(result, 'Got body back')
    t.notOk(Object.getOwnPropertyNames(stream.body).length, 'Body object is empty')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
  })
  teardown()
})

test('Arc v5: passthrough', t => {
  t.plan(1)
  process.env.DEPRECATED = true
  let req = { headers: { 'content-type': 'whatever' } }
  let res = {}
  binaryHandler(req, res, () => {
    t.notOk(Object.getOwnPropertyNames(res).length, 'Passed through, no mutation of response')
  })
  teardown()
})

test('Arc v5: base64 encode body', t => {
  t.plan(3)
  process.env.DEPRECATED = true
  let body = 'hi there'
  let e = new events()
  let stream = new Readable()
  stream.headers = {
    'content-type': 'application/octet-stream',
    'content-length': '8'
  }
  stream.body = 'hi there'
  stream.push(body)
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body.base64
    t.ok(result, 'Got base64 body back')
    t.equal(dec(result), body, 'Decoded body matches request')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
    teardown()
  })
})

test('Arc v5: handle empty body', t => {
  t.plan(3)
  process.env.DEPRECATED = true
  let e = new events()
  let stream = new Readable()
  stream.headers = {
    'content-type': 'multipart/form-data',
    'content-length': '8'
  }
  stream.body = 'hi there'
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body.base64
    t.notOk(result, 'Did not get base64 body object back')
    t.notOk(Object.getOwnPropertyNames(stream.body).length, 'Body object is empty')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
    teardown()
  })
})

test('Skip if missing content-length header', t => {
  t.plan(3)
  let e = new events()
  let stream = new Readable()
  stream.headers = {}
  stream.body = 'hi there'
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body.base64
    t.notOk(result, 'Did not get base64 body object back')
    t.notOk(Object.getOwnPropertyNames(stream.body).length, 'Body object is empty')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
    teardown()
  })
})

test('Skip if content-length is 0', t => {
  t.plan(3)
  let e = new events()
  let stream = new Readable()
  stream.headers = { 'content-length': '0' }
  stream.body = 'hi there'
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body.base64
    t.notOk(result, 'Did not get base64 body object back')
    t.notOk(Object.getOwnPropertyNames(stream.body).length, 'Body object is empty')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
    teardown()
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
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body.base64
    t.notOk(result, 'Did not get base64 body object back')
    t.notOk(Object.getOwnPropertyNames(stream.body).length, 'Body object is empty')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
    teardown()
  })
})
