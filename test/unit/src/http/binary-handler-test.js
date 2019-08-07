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
  let req = {headers: {'content-type': 'whatever'}}
  let res = {}
  binaryHandler(req, res, () => {
    t.notOk(Object.getOwnPropertyNames(res).length, 'Passed through, no mutation of response')
  })
})

test('Arc v5: base64 encode body', t => {
  t.plan(3)
  let body = 'hi there'
  let e = new events()
  let stream = new Readable()
  stream.headers = {'content-type': 'application/octet-stream'}
  stream.body = ''
  stream.push(body)
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body.base64
    t.ok(result, 'Got base64 body back')
    t.equals(dec(result), body, 'Decoded body matches request')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
  })
})

test('Arc v5: handle empty body', t => {
  t.plan(3)
  let e = new events()
  let stream = new Readable()
  stream.headers = {'content-type': 'multipart/form-data'}
  stream.body = ''
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    let result = stream.body.base64
    t.notOk(result, 'Did not get base64 body object back')
    t.notOk(Object.getOwnPropertyNames(stream.body).length, 'Body object is empty')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
  })
})

test('Arc v6: base64 encode body & flag', t => {
  t.plan(3)
  let body = 'hi there'
  let e = new events()
  let stream = new Readable()
  stream.headers = {}
  process.env.ARC_CFN = true
  stream.body = ''
  stream.push(body)
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    delete process.env.ARC_CFN
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
  process.env.ARC_CFN = true
  stream.body = ''
  stream.push(null)
  e.addListener('data', binaryHandler)
  e.emit('data', stream, {}, () => {
    delete process.env.ARC_CFN
    let result = stream.body
    t.ok(result, 'Gott body back')
    t.notOk(Object.getOwnPropertyNames(stream.body).length, 'Body object is empty')
    t.notOk(stream.isBase64Encoded, 'isBase64Encoded param NOT set')
  })
})
