let { join } = require('path')
let { existsSync } = require('fs')
let test = require('tape')
let tiny = require('tiny-json-http')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { run, startup, shutdown, url } = require('../utils')
let mock = join(process.cwd(), 'test', 'mock')
let syncFile = join(mock, 'plugins-sync', 'syncplugin.test')
let asyncFile = join(mock, 'plugins-async', 'asyncplugin.test')

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got Sandbox')
})

test('Run plugins tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  let mode = `[Plugins / ${runType}]`

  t.test(`${mode} Start Sandbox (sync)`, t => {
    startup[runType](t, 'plugins-sync', { planAdd: 1 }, () => {
      t.ok(existsSync(syncFile), `plugin sandbox service start executed successfully (created ${syncFile})`)
    })
  })

  t.test(`${mode} Shut down Sandbox (sync)`, t => {
    shutdown[runType](t, { planAdd: 1 }, () => {
      t.notOk(existsSync(syncFile), `plugin sandbox service end executed successfully (removed ${syncFile})`)
    })
  })

  t.test(`${mode} Start Sandbox (async)`, async t => {
    t.plan(2)
    await startup[runType].async(t, 'plugins-async', { planAdd: 1 })
    t.ok(existsSync(asyncFile), `plugin sandbox service start executed successfully (created ${asyncFile})`)
  })

  t.test(`${mode} Shut down Sandbox (async)`, async t => {
    t.plan(2)
    await shutdown[runType].async(t, { planAdd: 1 })
    t.notOk(existsSync(asyncFile), `plugin sandbox service end executed successfully (removed ${asyncFile})`)
  })

  t.test(`${mode} Start Sandbox`, t => {
    process.env.FEATURE_PLUG_HTTP = true
    startup[runType](t, 'plugins-add-route')
  })

  t.test(`${mode} get /test`, t => {
    t.plan(2)
    tiny.get({
      url: url + '/test'
    }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        console.log(result)
        t.ok(result.body === 'Hello World', 'response from custom route')
      }
      delete process.env.FEATURE_PLUG_HTTP
      t.pass('wait to clear function flag')
    })

  })

  t.test(`${mode} Start Sandbox`, t => {
    shutdown[runType](t, 'plugins-add-route')
  })

}
