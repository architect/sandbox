let { join } = require('path')
let test = require('tape')
let fs = require('fs')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let cwd = process.cwd()
let mock = join(__dirname, '..', 'mock')
let file = join(mock, 'plugins-sync', 'syncplugin.test')

test('Set up env', t => {
  t.plan(2)
  t.ok(sandbox, 'Sandbox is present')
  t.ok(sandbox.start, 'sandbox.start module is present')
  process.chdir(join(mock, 'plugins-sync'))
})

test('Sync sandbox.start', t => {
  process.chdir(join(mock, 'plugins-sync'))
  t.plan(1)
  sandbox.start({ quiet: true }, function (err) {
    if (err) t.fail(err, 'Sandbox failed (sync)')
    else {
      t.ok(fs.existsSync(file), `plugin sandbox service start executed successfully (created ${file})`)
    }
  })
})

test('Sync sandbox.end', t => {
  t.plan(2)
  sandbox.end(() => {
    process.chdir(cwd)
    t.equal(process.cwd(), cwd, 'Switched back to original working dir')
    t.notOk(fs.existsSync(file), `plugin sandbox service end executed successfully (removed ${file})`)
  })
})
