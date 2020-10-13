let { join } = require('path')
let test = require('tape')
let tiny = require('tiny-json-http')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let cwd = process.cwd()
let mock = join(__dirname, '..', 'mock')
let url = `http://localhost:${process.env.PORT || 3333}`

// Verify sandbox shut down
let shutdown = (t, err) => {
  t.equal(err.code, 'ECONNREFUSED', 'Sandbox succssfully shut down')
}

test('Set up env', t => {
  t.plan(2)
  t.ok(sandbox, 'Sandbox is present')
  t.ok(sandbox.start, 'sandbox.start module is present')
  process.chdir(join(mock, 'normal'))
})

test('Async sandbox.start', async t => {
  t.plan(1)
  try {
    await sandbox.start({ quiet: true })
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

test('Sync sandbox.start', t => {
  t.plan(1)
  sandbox.start({ quiet: true }, function (err) {
    if (err) t.fail('Sandbox failed (sync)')
    else t.pass('Sandbox started (sync)')
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
