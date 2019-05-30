let url = require('url')
let aws = require('aws-sdk')
let path = require('path')
let fs = require('fs')
let rm = require('rimraf')
let mkdir = require('mkdirp')
let {get} = require('http')
let test = require('tape')
let {http} = require('../')
let init = require('@architect/utils/init')

let mockFile = path.join(process.cwd(), 'src', 'http', 'get-index', 'index.js')
let mockFun = `exports.handler = async ()=> ({body:JSON.stringify({yay:true})})`

let client
test('http.start', t=> {
  t.plan(2)
  t.ok(http, 'got http')
  // set the default port
  process.env.PORT = 3333
  // move to test/mock
  process.chdir(path.join(__dirname, 'mock'))
  client = http.start(function() {
    t.ok(true, '@http mounted')
  })
})

test('get /health', t=> {
  t.plan(2)
  var req = get('http://localhost:3333/health', function done(res) {
    var raw = []
    res.on('data', function data(d) {raw.push(d)})
    res.on('end', function end() {
      let result = Buffer.concat(raw).toString()
      t.ok(res.statusCode === 200, 'got 200 response')
      t.ok(true, 'ok')
      console.log(result)
    })
  })
  req.on('error', t.fail)
})

test('http.close', t=> {
  t.plan(1)
  client.close()
  t.ok(true, 'http connection closed')
})
