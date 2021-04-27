let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let cwd = process.cwd()
let mock = join(__dirname, '..', 'mock')
let tiny = require('tiny-json-http')

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
      t.pass('sandbox started up')
    }
  })
})

test('plugin service discovery variable exposed over HTTP via sandbox ssm module', t => {
  t.plan(2)
  let port = process.env.PORT ? process.env.PORT - 1 : 3332
  let url = `http://localhost:${port}/_arc/ssm`
  tiny.post({ url, data: { Path: '/plugins-sandbox' } }, function (err, data) {
    if (err) t.fail(err)
    else {
      t.ok(data, 'got a response from sandbox ssm module')
      t.equals(data.body.Parameters[0].Value, 'valueOne', 'correct plugin variable export returned by sandbox ssm module')
    }
  })
})

test('Sync sandbox.end', t => {
  t.plan(1)
  sandbox.end(() => {
    process.chdir(cwd)
    t.equal(process.cwd(), cwd, 'Switched back to original working dir')
  })
})
