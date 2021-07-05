let { join } = require('path')
let { existsSync, stat } = require('fs')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let mock = join(process.cwd(), 'test', 'mock')
let syncFile = join(mock, 'plugins-sync', 'syncplugin.test')
let asyncFile = join(mock, 'plugins-async', 'asyncplugin.test')

function exists (f) {
  let callback
  let promise = new Promise(function (res, rej) {
    callback = function (err) {
      if (err) {
        if (err.code === 'ENOENT') res(false)
        else rej(err)
      }
      else res(true)
    }
  })
  stat(f, callback)
  return promise
}

test('Set up env', t => {
  t.plan(2)
  t.ok(sandbox, 'Sandbox is present')
  t.ok(sandbox.start, 'sandbox.start module is present')
})


test('Sync sandbox.start', t => {
  t.plan(1)
  sandbox.start({ cwd: join(mock, 'plugins-sync'), quiet: true }, function (err) {
    if (err) t.fail(err, 'Sandbox failed (sync)')
    else t.ok(existsSync(syncFile), `plugin sandbox service start executed successfully (created ${syncFile})`)
  })
})

test('Sync sandbox.end', t => {
  t.plan(1)
  sandbox.end(() => {
    t.notOk(existsSync(syncFile), `plugin sandbox service end executed successfully (removed ${syncFile})`)
  })
})


test('Async sandbox.start', async t => {
  t.plan(1)
  try {
    await sandbox.start({ cwd: join(mock, 'plugins-async'), quiet: true })
  }
  catch (err) {
    t.fail(err)
  }
  try {
    let result = await exists(asyncFile)
    t.ok(result, `plugin sandbox service start executed successfully (created ${asyncFile})`)
  }
  catch (err) {
    t.fail(err)
  }
})

test('Async sandbox.end', async t => {
  t.plan(1)
  try {
    await sandbox.end()
  }
  catch (err) {
    t.fail(err)
  }
  try {
    let result = await exists(asyncFile)
    t.notOk(result, `plugin sandbox service end executed successfully (removed ${asyncFile})`)
  }
  catch (err) {
    t.fail(err)
  }
})
