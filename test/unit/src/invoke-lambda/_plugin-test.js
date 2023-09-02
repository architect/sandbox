let { join } = require('path')
let test = require('tape')
let cwd = process.cwd()
let sandbox = require(cwd)
let { port, quiet } = require('../../../utils/_lib')
let mock = join(cwd, 'test', 'mock', 'plugins-invoke')
let plugin = require(join(mock, 'src', 'plugins', 'myplugin.js'))

test(`Start Sandbox`, async t => {
  t.plan(1)
  let result = await sandbox.start({ cwd: join(mock), port, quiet })
  t.equal(result, 'Sandbox successfully started', 'Sandbox started')
})

test('Test plugin invoke() method', async t => {
  t.plan(10)
  let result
  let pragma = 'events', payload = {}

  // Success
  result = await plugin.invoke({ pragma, name: 'success-no-result', payload })
  t.equal(result, undefined, 'Successful execution returned undefined')

  result = await plugin.invoke({ pragma, name: 'success-result', payload })
  t.deepEqual(result, { ok: true }, 'Successful execution returned result')

  // Failures
  try {
    await plugin.invoke({ pragma: 'http', name: 'get /', payload })
  }
  catch (err) {
    t.match(err.message, /Cannot find Lambda/, 'Could not invoke missing Lambda')
  }

  try {
    await plugin.invoke({ pragma: 'events', name: 'fail-userland', payload })
  }
  catch (err) {
    t.match(err.name, /ReferenceError/, `Error included correct name: ${err.name}`)
    t.match(err.message, /bar is not defined/, `Error included correct message: ${err.message}`)
    t.match(err.stack, /fail-userland[\/\\]index.js/, 'Error included valid stacktrace')
  }

  try {
    await plugin.invoke({ pragma: 'events', name: 'fail-missing-handler', payload })
  }
  catch (err) {
    // Error name + stack aren't relevant here (ofc, chance this later if that is no longer the case!)
    t.match(err.message, /missing Lambda handler file/, `Error included correct message: ${err.message}`)
  }

  try {
    await plugin.invoke({ pragma: 'events', name: 'fail-init', payload })
  }
  catch (err) {
    t.match(err.name, /ReferenceError/, `Error included correct name: ${err.name}`)
    t.match(err.message, /exports is not defined in ES module scope/, `Error included correct message: ${err.message}`)
    t.match(err.stack, /fail-init[\/\\]index.mjs/, 'Error included valid stacktrace')
  }
})

test(`Shut down Sandbox`, async t => {
  t.plan(1)
  let result = await sandbox.end()
  t.equal(result, 'Sandbox successfully shut down', 'Sandbox shut down')
})
