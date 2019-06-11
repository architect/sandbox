let path = require('path')
let test = require('tape')
let sandbox = require('../src')

test('sandbox.start', t=> {
  t.plan(2)
  t.ok(sandbox, 'has sandbox')
  t.ok(sandbox.start, 'has sandbox.start')
})

let close
test('sandbox.start test/mock', async t=> {
  t.plan(1)
  process.chdir(path.join(__dirname, 'mock'))
  close = await sandbox.start()
  t.ok(true, 'started')
})

test('sandbox.close', async t=> {
  t.plan(1)
  close()
  t.ok(true, 'closed')
})
