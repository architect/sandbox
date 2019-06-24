let path = require('path')
let test = require('tape')
let sandbox = require('../src')

test('sandbox.start', t=> {
  t.plan(2)
  t.ok(sandbox, 'has sandbox')
  t.ok(sandbox.start, 'has sandbox.start')
})

let asyncClose
test('async sandbox.start test/mock', async t=> {
  t.plan(1)
  process.chdir(path.join(__dirname, 'mock'))
  asyncClose = await sandbox.start()
  t.ok(true, 'started')
})

test('async sandbox.close', async t=> {
  t.plan(1)
  asyncClose()
  t.ok(true, 'closed')
})

let syncClose
test('sync sandbox.start test/mock', t=> {
  t.plan(1)
  process.chdir(path.join(__dirname, 'mock'))
  sandbox.start({}, function (err, end) {
    if (err) t.fail('Sandbox startup failure')
    else {
      syncClose = end
      t.ok(true, 'started')
    }
  })
})

test('sync sandbox.close', t=> {
  t.plan(1)
  syncClose()
  t.ok(true, 'closed')
})
