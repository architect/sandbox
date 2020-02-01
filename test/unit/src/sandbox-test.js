let test = require('tape')
let sandbox = require('../../../src')
let {join} = require('path')
let origCwd = process.cwd()

test('Set up env', t => {
  t.plan(3)
  t.ok(sandbox, 'Found sandbox')
  t.ok(sandbox.start, 'Found sandbox.start')
  t.ok(sandbox.end, 'Found sandbox.end')
})

test('sandbox returns a Promise or uses continuation passing', t => {
  t.plan(8)
  process.env.ARC_QUIET = true
  process.chdir(join(__dirname, '..', '..', 'mock', 'no-functions'))

  // FYI: setTimeouts to advance ticks and maybe give the sandbox time to start up / shut down between invocations
  let isPromise
  setTimeout(() => {
    isPromise = sandbox.start() instanceof Promise
    t.ok(isPromise, 'sandbox.start returned Promise (without params)')
  }, 50)
  setTimeout(() => {
    isPromise = sandbox.end() instanceof Promise
    t.ok(isPromise, 'sandbox.end returned Promise (without params)')
  }, 50)

  setTimeout(() => {
    isPromise = sandbox.start({foo: 'bar'}) instanceof Promise
    t.ok(isPromise, 'sandbox.start returned Promise (with params)')
  }, 50)
  setTimeout(async () => {
    await sandbox.end()
  }, 50)

  let end
  setTimeout(() => {
    sandbox.start(null, (err, fn) => {
      if (err) t.fail(err)
      t.pass('sandbox.start executed callback (null params)')
      end = fn
      let isFunction = end instanceof Function
      t.ok(isFunction, 'sandbox.start returned sandbox.end')
    })
  }, 50)
  setTimeout(() => {
    end(t.pass('Function returned by sandbox.start executed callback'))
  }, 50)

  setTimeout(() => {
    sandbox.start({port: 3333, options: [], version: ' '},
    () => (t.pass('sandbox.start executed callback (with params)')))
  }, 50)
  setTimeout(() => {
    sandbox.end(t.pass('sandbox.end executed callback'))
  }, 50)
})

test('Teardown', t => {
  t.plan(2)
  process.chdir(origCwd)
  delete process.env.ARC_QUIET
  t.equals(process.cwd(), origCwd)
  t.notOk(process.env.ARC_QUIET)
})
