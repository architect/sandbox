let { join } = require('path')
let test = require('tape')
let tiny = require('tiny-json-http')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let mock = join(process.cwd(), 'test', 'mock', 'normal')
let { port, quiet, url } = require('../utils')
let cwd = process.cwd()
let msg = 'Hello from get / running the default runtime'

// Verify sandbox shut down
let shutdown = (t, err) => {
  t.equal(err.code, 'ECONNREFUSED', 'Sandbox succssfully shut down')
}

test('Set up env', t => {
  t.plan(3)
  t.ok(sandbox, 'Sandbox is present')
  t.ok(sandbox.start, 'sandbox.start module is present')
  t.ok(sandbox.end, 'sandbox.end module is present')
})

test('Async sandbox.start (with cwd param)', async t => {
  t.plan(2)
  try {
    await sandbox.start({ cwd: mock, port, quiet })
    t.pass('Sandbox started (async)')
    let result = await tiny.get({ url })
    t.equal(msg, result.body.message, 'Got back get / handler')
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

test('Async sandbox.start (from process.cwd)', async t => {
  t.plan(3)
  try {
    process.chdir(mock)
    t.equal(process.cwd(), mock, 'Process changed to mock dir')
    await sandbox.start({ port, quiet })
    t.pass('Sandbox started (async)')
    let result = await tiny.get({ url })
    t.equal(msg, result.body.message, 'Got back get / handler')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Async sandbox.end', async t => {
  t.plan(2)
  try {
    let ended = await sandbox.end()
    t.equal(ended, 'Sandbox successfully shut down', 'Sandbox ended')
    process.chdir(cwd)
    t.equal(process.cwd(), cwd, 'Changed back to original working dir')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Sync sandbox.start (with cwd param)', t => {
  t.plan(2)
  sandbox.start({ cwd: mock, port, quiet }, function (err) {
    if (err) t.fail('Sandbox failed (sync)')
    else {
      t.pass('Sandbox started (sync)')
      tiny.get({ url }, function (err, result) {
        if (err) t.fail(err)
        else t.equal(msg, result.body.message, 'Got back get / handler')
      })
    }
  })
})

test('Sync sandbox.end', t => {
  t.plan(1)
  sandbox.end(() => {
    tiny.get({ url }, err => {
      if (err) shutdown(t, err)
      else t.fail('Sandbox did not shut down')
    })
  })
})

test('Sync sandbox.start (from process.cwd)', t => {
  t.plan(3)
  process.chdir(mock)
  t.equal(process.cwd(), mock, 'Process changed to mock dir')
  sandbox.start({ port, quiet }, function (err) {
    if (err) t.fail('Sandbox failed (sync)')
    else {
      t.pass('Sandbox started (sync)')
      tiny.get({ url }, function (err, result) {
        if (err) t.fail(err)
        else t.equal(msg, result.body.message, 'Got back get / handler')
      })
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
        t.equal(process.cwd(), cwd, 'Changed back to original working dir')
      }
      else t.fail('Sandbox did not shut down')
    })
  })
})
