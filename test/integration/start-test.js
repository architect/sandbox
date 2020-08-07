let path = require('path')
let test = require('tape')
let tiny = require('tiny-json-http')
let sandbox = require('../../src')
let cwd = process.cwd()
let url = `http://localhost:${process.env.PORT || 3333}`

// Verify sandbox shut down
let shutdown = (t, err) => {
  t.equal(err.code, 'ECONNREFUSED', 'Sandbox succssfully shut down')
}

test('sandbox.start', t => {
  t.plan(2)
  t.ok(sandbox, 'Has sandbox')
  t.ok(sandbox.start, 'Has sandbox.start')
})

test('Async sandbox.start test/mock', async t => {
  t.plan(1)
  process.chdir(path.join(__dirname, '..', 'mock', 'normal'))
  try {
    await sandbox.start()
    t.pass('Sandbox started (async)')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Async sandbox.end', async t => {
  t.plan(1)
  try {
    let ended = await sandbox.end()
    t.equal(ended, 'Sandbox successfully shut down', 'Sandbox ended')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Sync sandbox.start test/mock', t => {
  t.plan(1)
  sandbox.start({}, function (err) {
    if (err) t.fail('Sandbox failed (sync)')
    else {
      t.pass('Sandbox started (sync)')
    }
  })
})

test('Sync sandbox.end', t => {
  t.plan(2)
  sandbox.end(() => {
    tiny.get({ url }, err => {
      if (err) {
        shutdown(t, err)
        process.chdir(cwd)
        t.equal(process.cwd(), cwd, 'Switched back to original working dir')
      }
      else t.fail('Sandbox did not shut down')
    })
  })
})
