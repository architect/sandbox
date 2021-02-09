let { join } = require('path')
let test = require('tape')
let os = require('os')
let fs = require('fs')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let cwd = process.cwd()
let mock = join(__dirname, '..', 'mock')

// TODO: unskip the tests once new inventory version is bumped
test.skip('Set up env', t => {
  t.plan(2)
  t.ok(sandbox, 'Sandbox is present')
  t.ok(sandbox.start, 'sandbox.start module is present')
  process.chdir(join(mock, 'plugins-sync'))
})

test.skip('Sync sandbox.start', t => {
  process.chdir(join(mock, 'plugins-sync'))
  t.plan(1)
  sandbox.start({ quiet: true }, function (err) {
    if (err) t.fail('Sandbox failed (sync)')
    else {
      t.ok(fs.existsSync(join(os.tmpdir(), 'syncplugin.test')), 'plugin sandbox service start executed successfully')
    }
  })
})

test.skip('Sync sandbox.end', t => {
  t.plan(2)
  sandbox.end(() => {
    process.chdir(cwd)
    t.equal(process.cwd(), cwd, 'Switched back to original working dir')
    t.notOk(fs.existsSync(join(os.tmpdir(), 'syncplugin.test')), 'plugin sandbox service end executed successfully')
  })
})
