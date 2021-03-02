let test = require('tape')
let sinon = require('sinon')
let child_process = require('child_process')
let forkStub = {
  send: sinon.spy(),
  on: () => {}
}
sinon.stub(child_process, 'fork').returns(forkStub)
let events = require('../../../../src/events/_listener')

let inv = { get: { queues: () => 'queue', events: () => 'event' } }
let baseReq = {
  on: (evt, cb) => cb('{}')
}

test('Event listener should send a queue message to subprocess fork on queue url', t => {
  t.plan(3)
  let req = Object.assign({ url: '/queues' }, baseReq)
  let res = { end: sinon.spy() }
  events(inv, req, res)
  t.ok(forkStub.send.calledWithMatch({ lambda: 'queue', arcType: 'queue' }), 'send called with appropriate message object')
  t.equals(res.statusCode, 200, 'response status code set to 200')
  t.ok(res.end.calledWith('ok'), 'response end called with ok body')
})

test('Event listener should send an events message to subprocess fork on events url', t => {
  t.plan(3)
  let req = Object.assign({ url: '/events' }, baseReq)
  let res = { end: sinon.spy() }
  events(inv, req, res)
  t.ok(forkStub.send.calledWithMatch({ lambda: 'event', arcType: 'event' }), 'send called with appropriate message object')
  t.equals(res.statusCode, 200, 'response status code set to 200')
  t.ok(res.end.calledWith('ok'), 'response end called with ok body')
})

test('Event listener should respond with HTTP 400 if malformed JSON is sent to it', t => {
  t.plan(2)
  let req = { on: (evt, cb) => cb('this is not a JSON body') }
  let res = { end: sinon.spy() }
  events(inv, req, res)
  t.equals(res.statusCode, 400, 'response status code set to 400')
  t.ok(res.end.calledWith('Sandbox @event bus exception parsing request body'), 'response end called with ok body')
})
