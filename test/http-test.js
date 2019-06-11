let path = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let {http} = require('../src')

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

test('get /', t=> {
  t.plan(2)
  tiny.get({
    url: 'http://localhost:3333/'
  }, function _got(err, data) {
    if (err) t.fail(err)
    else {
      t.ok(true, 'got /')
      t.ok(data.body.startsWith('Hello world!'), 'is hello world')
      console.log({data})
    }
  })
})

// TODO possibly some POST/PUT/PATCH/DELETE tests?

test('http.close', t=> {
  t.plan(1)
  client.close()
  t.ok(true, 'http connection closed')
})
