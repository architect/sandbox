let { join } = require('path')
let { existsSync } = require('fs')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { startup, shutdown } = require('../utils')
let mock = join(process.cwd(), 'test', 'mock')
let syncFile = join(mock, 'plugins-sync', 'syncplugin.test')
let asyncFile = join(mock, 'plugins-async', 'asyncplugin.test')

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got Sandbox')
})

test('Module', t => {
  runTests('module')
  t.end()
})

test('Binary', t => {
  let bin = join(process.cwd(), 'bin', 'sandbox-binary')
  if (existsSync(bin)) {
    runTests('binary')
    t.end()
  }
  else t.end()
})

function runTests (runType) {
  let mode = `[Plugins / ${runType}]`

  test(`${mode} Start Sandbox (sync)`, t => {
    startup[runType](t, 'plugins-sync', { planAdd: 1 }, () => {
      t.ok(existsSync(syncFile), `plugin sandbox service start executed successfully (created ${syncFile})`)
    })
  })

  test(`${mode} Shut down Sandbox (sync)`, t => {
    shutdown[runType](t, { planAdd: 1 }, () => {
      t.notOk(existsSync(syncFile), `plugin sandbox service end executed successfully (removed ${syncFile})`)
    })
  })

  test(`${mode} Start Sandbox (async)`, async t => {
    t.plan(2)
    await startup[runType].async(t, 'plugins-async', { planAdd: 1 })
    t.ok(existsSync(asyncFile), `plugin sandbox service start executed successfully (created ${asyncFile})`)
  })

  test(`${mode} Shut down Sandbox (async)`, async t => {
    t.plan(2)
    await shutdown[runType].async(t, { planAdd: 1 })
    t.notOk(existsSync(asyncFile), `plugin sandbox service end executed successfully (removed ${asyncFile})`)
  })
}
