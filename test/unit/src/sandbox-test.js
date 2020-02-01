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

test('sandbox returns a Promise or uses continuation passing', async t => {
  t.plan(8)
  process.env.ARC_QUIET = true
  process.chdir(join(__dirname, '..', '..', 'mock', 'no-functions'))

  try {
    let end = await sandbox.start()
    t.pass('sandbox.start returned Promise (without params)')
    let returnedFn = end instanceof Function
    t.ok(returnedFn, 'sandbox.start resolved and returned function (without params)')
  }
  catch (err) {
    t.fail(err)
  }

  try {
    let result = await sandbox.end()
    t.pass('sandbox.end returned Promise (without params)')
    let returnedStr = typeof result === 'string'
    t.ok(returnedStr, `sandbox.end resolved and returned string: ${result}`)
  }
  catch (err) {
    t.fail(err)
  }

  try {
    let end = await sandbox.start({foo: 'bar'})
    t.pass('sandbox.start returned Promise (with params)')
    let returnedFn = end instanceof Function
    t.ok(returnedFn, 'sandbox.start resolved and returned function (with params)')
    let result = await end()
    t.pass('Function returned by sandbox.start returns a Promise')
    let returnedStr = typeof result === 'string'
    t.ok(returnedStr, `Function returned by sandbox.start returned string: ${result}`)
  }
  catch (err) {
    t.fail(err)
  }
})

test('Sandbox uses continuation passing', t => {
  t.plan(5)

  // FYI: setTimeouts to advance ticks and maybe give the sandbox time to start up / shut down between invocations
  let end
  setTimeout(() => {
    sandbox.start({}, (err, fn) => {
      if (err) t.fail(err)
      t.pass('sandbox.start executed callback (null params)')
      end = fn
      let isFunction = end instanceof Function
      t.ok(isFunction, 'sandbox.start returned sandbox.end')
      end(t.pass('Function returned by sandbox.start executed callback'))
    })
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
