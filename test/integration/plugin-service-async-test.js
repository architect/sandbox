let { join } = require('path')
let fs = require('fs')
let os = require('os')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let cwd = process.cwd()
let mock = join(__dirname, '..', 'mock')

// TODO: unskip the tests once new inventory version is bumped
test.skip('Set up env', t => {
  t.plan(2)
  t.ok(sandbox, 'Sandbox is present')
  t.ok(sandbox.start, 'sandbox.start module is present')
  process.chdir(join(mock, 'plugins-async'))
})

test.skip('Async sandbox.start', async t => {
  t.plan(1)
  try {
    await sandbox.start({ quiet: true })
  }
  catch (err) {
    t.fail(err)
  }
  t.ok(fs.existsSync(join(os.tmpdir(), 'asyncplugin.test')), 'plugin sandbox service start executed successfully')
})

test.skip('Async sandbox.end', async t => {
  t.plan(2)
  try {
    await sandbox.end()
  }
  catch (err) {
    t.fail(err)
  }
  t.notOk(fs.existsSync(join(os.tmpdir(), 'asyncplugin.test')), 'plugin sandbox service end executed successfully')
  process.chdir(cwd)
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
