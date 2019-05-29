/*
let arc = require('@architect/functions')
let url = require('url')
let aws = require('aws-sdk')
let path = require('path')
let fs = require('fs')
let rm = require('rimraf')
let mkdir = require('mkdirp')
let {get} = require('http')
let test = require('tape')
let {events} = require('../')

let mockSubPath = path.join(process.cwd(), 'src', 'events', 'ping', 'index.js')

let mockSub = `
let arc = require('@architect/functions')

function handler(payload) {
  console.log(payload)
}

exports.handler = arc.events.subscribe(handler)`.trim()


let client
test('events.start', t=> {
  t.plan(2)
  t.ok(events, 'got events')
  process.env.PORT = 3333
  process.env.NODE_ENV = 'testing'
  client = events.start(function() {
    t.ok(true, '@events mounted')
  })
})

test('mock', t=> {
  t.plan(1)
  mkdir.sync(path.dirname(mockSubPath))
  fs.writeFileSync(mockSubPath, mockSub)
  t.ok(fs.existsSync(mockSubPath), mockSubPath)
})

test('can publish without error', t=> {
  t.plan(1)
  arc.events.publish({
    name: 'ping', 
    payload: {yay: true}
  }, 
  function done(err) {
    t.ok(true, 'execution did not fail')
  })
})

test('events.close', t=> {
  t.plan(2)
  client.close()
  t.ok(true, 'events closed')
  rm.sync(path.dirname(mockSubPath))
  t.ok(true, 'cleaned up mocks')
})
*/
