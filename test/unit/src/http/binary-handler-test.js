let binaryHandler = require('../../../../src/http/binary-handler')
let events = require('events').EventEmitter
let {Readable} = require('stream')
let test = require('tape')
let dec = i => new Buffer.from(i, 'base64').toString()

test('Set up env', t => {
  t.plan(1)
  t.ok(binaryHandler, 'Got binary handler')
})

test('Passthrough', t => {
  t.plan(1)
  process.env.DEPRECATED = true
  let req = {headers: {'content-type': 'whatever'}}
  let res = {}
  binaryHandler(req, res, () => {
    t.notOk(Object.getOwnPropertyNames(res).length, 'Passed through, no mutation of response')
  })
  delete process.env.DEPRECATED
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
    t.equals(dec(result), body, 'Decoded body matches request')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
    delete process.env.DEPRECATED
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
    delete process.env.DEPRECATED
  })
})

test('Arc v6: base64 encode body & flag', t => {
  t.plan(3)
  let body = 'hi there'
  let e = new events()
  let stream = new Readable()
  stream.headers = {'content-length': '8'}
  stream.body = ''
  stream.push(body)
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body
    t.ok(result, 'Got base64 body back')
    t.equals(dec(result), body, 'Decoded body matches request')
    t.ok(stream.isBase64Encoded, 'isBase64Encoded param set')
  })
})

test('Arc v6: base64 encode body & flag', t => {
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
})
