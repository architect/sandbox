let { join } = require('path')
let fs = require('fs')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let cwd = process.cwd()
let mock = join(__dirname, '..', 'mock')
let file = join(process.cwd(), 'test', 'mock', 'plugins-async', 'asyncplugin.test')

function exists (f) {
  let callback
  let promise = new Promise(function (res, rej) {
    callback = function (err) {
      if (err) {
        if (err.code === 'ENOENT') res(false)
        else rej(err)
      }
      else {
        res(true)
      }
    }
  })
  fs.stat(f, callback)
  return promise
}

test('Set up env', t => {
  t.plan(2)
  t.ok(sandbox, 'Sandbox is present')
  t.ok(sandbox.start, 'sandbox.start module is present')
  process.chdir(join(mock, 'plugins-async'))
})

test('Async sandbox.start', async t => {
  t.plan(1)
  try {
    await sandbox.start({ quiet: true })
  }
  catch (err) {
    t.fail(err)
  }
  let result
  try {
    result = await exists(file)
  }
  catch (err) {
    t.fail(err)
  }
  t.ok(result, `plugin sandbox service start executed successfully (created ${file})`)
})

test('Async sandbox.end', async t => {
  t.plan(2)
  try {
    await sandbox.end()
  }
  catch (err) {
    t.fail(err)
  }
  let result
  try {
    result = await exists(file)
  }
  catch (err) {
    t.fail(err)
  }
  t.notOk(result, `plugin sandbox service end executed successfully (removed ${file})`)
  process.chdir(cwd)
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
