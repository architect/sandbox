let test = require('tape')
let { EventEmitter } = require('events')
let proxyquire = require('proxyquire')
let params = null
let listener = proxyquire('../../../../src/arc/_listener', {
  './_ssm': (ps, req, res) => { params = ps; res.end() }
})
let req
let res
function reset (t) {
  req = new EventEmitter()
  res = { end: () => { t.pass('HTTP response end invoked') } }
  params = null
}

test('ssm listener returns 404 for non-POST requests', t => {
  t.plan(2)
  reset(t)
  req.method = 'GET'
  listener({}, req, res)
  t.equals(res.statusCode, 404, 'HTTP response status code set to 404')
})
test('ssm listener returns 404 for POST requests to paths other than /_arc/ssm', t => {
  t.plan(2)
  reset(t)
  req.method = 'POST'
  req.url = '/something/else'
  listener({}, req, res)
  req.emit('end')
  t.equals(res.statusCode, 404, 'HTTP response status code set to 404')
})
test('ssm listener passes request body to SSM service module for POST requests to /_arc/ssm', t => {
  t.plan(2)
  reset(t)
  req.method = 'POST'
  req.url = '/_arc/ssm'
  listener({}, req, res)
  req.emit('data', { toString: () => 'somedata' })
  req.emit('end')
  t.equals(params.body, 'somedata', 'HTTP request body passed to ssm server module')
})
