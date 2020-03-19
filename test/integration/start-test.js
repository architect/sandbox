let path = require('path')
let test = require('tape')
let tiny = require('tiny-json-http')
let sandbox = require('../../src')
let cwd = process.cwd()
let url = 'http://localhost:6666'

// Verify sandbox shut down
let shutdown = (t, err) => {
  t.equal(err.code, 'ECONNREFUSED', 'Sandbox succssfully shut down')
}

test('sandbox.start', t=> {
  t.plan(2)
  t.ok(sandbox, 'Has sandbox')
  t.ok(sandbox.start, 'Has sandbox.start')
})

let asyncClose
test('Async sandbox.start test/mock', async t=> {
  t.plan(1)
  process.chdir(path.join(__dirname, '..', 'mock', 'normal'))
  asyncClose = await sandbox.start()
  t.ok(asyncClose, 'Sandbox started (async)')
})

test('Async sandbox.close', async t=> {
  t.plan(1)
  let closed = await asyncClose()
  t.equal(closed, 'Sandbox successfully shut down', 'Sandbox closed')
})

let syncClose
test('Sync sandbox.start test/mock', t=> {
  t.plan(1)
  sandbox.start({}, function (err, end) {
    if (err) t.fail('Sandbox failed (sync)')
    else {
      syncClose = end
      t.ok(syncClose, 'Sandbox started (sync)')
    }
  })
})

test('Sync sandbox.close', t=> {
  t.plan(2)
  syncClose(() => {
    tiny.get({url}, err => {
      if (err) shutdown(t, err)
      else t.fail('Sandbox did not shut down')
    })
  })
  process.chdir(cwd)
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
