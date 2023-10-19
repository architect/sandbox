let test = require('tape')
let sandbox = require('../../../src')
let { join } = require('path')
let series = require('run-series')
let mock = join(process.cwd(), 'test', 'mock')
let { copy, port, quiet, verifyShutdown } = require(join(process.cwd(), 'test', 'utils'))

test('Set up env', t => {
  t.plan(3)
  t.ok(sandbox, 'Found sandbox')
  t.ok(sandbox.start, 'Found sandbox.start')
  t.ok(sandbox.end, 'Found sandbox.end')
})

// These next tests also try starting sandbox with valid, invalid, `null`, and `undefined` options
test('Sandbox returns a Promise', async t => {
  t.plan(8)
  try {
    await sandbox.start({ cwd: join(mock, 'no-functions'), port, quiet })
    t.pass('sandbox.start returned Promise (without params)')
  }
  catch (err) {
    t.fail(err)
  }

  try {
    let result = await sandbox.end()
    t.pass('sandbox.end returned Promise (without params)')
    let returnedStr = typeof result === 'string'
    t.ok(returnedStr, `sandbox.end resolved and returned string: ${result}`)
    await verifyShutdown.async(t, 'sandbox.end()')
  }
  catch (err) {
    t.fail(err)
  }

  try {
    await sandbox.start({ foo: 'bar' })
    t.pass('sandbox.start returned Promise (with params)')
    let result = await sandbox.end()
    t.pass('sandbox.end returned Promise (without params)')
    let returnedStr = typeof result === 'string'
    t.ok(returnedStr, `sandbox.end resolved and returned string: ${result}`)
    await verifyShutdown.async(t, 'sandbox.end()')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Sandbox uses continuation passing', t => {
  t.plan(6)
  series([
    callback => {
      sandbox.start(null, err => {
        if (err) t.end(err)
        t.pass('sandbox.start executed callback (null params)')
        callback()
      })
    },

    callback => {
      sandbox.end(() => {
        t.pass('sandbox.end executed callback')
        verifyShutdown(t, 'sandbox.end()', callback)
      })
    },

    callback => {
      sandbox.start(undefined, err => {
        if (err) t.end(err)
        t.pass('sandbox.start executed callback (with params)')
        callback()
      })
    },

    callback => {
      sandbox.end(() => {
        t.pass('sandbox.end executed callback')
        verifyShutdown(t, 'sandbox.end()', callback)
      })
    },
  ])
})

// Standard env vars that may be populated during a banner / AWS init
let envVars = [
  'ARC_APP_NAME',
  'ARC_AWS_CREDS',
  'ARC_ENV',
  'ARC_SANDBOX',
  'AWS_ACCESS_KEY_ID',
  'AWS_PROFILE',
  'AWS_REGION',
  'AWS_SECRET_ACCESS_KEY',
]

function cleanEnv (t) {
  envVars.forEach(v => delete process.env[v])
  let isClean = envVars.some(v => !process.env[v])
  t.ok(isClean, 'Sandbox env vars cleaned')
}

test('Sandbox only minimally mutates env vars', async t => {
  t.plan(5)
  let before
  let after
  cleanEnv(t)

  // Architect 6+ (local)
  before = copy(process.env)
  await sandbox.start({ cwd: join(mock, 'normal'), port, quiet })
  after = copy(process.env)
  envVars.forEach(v => delete after[v])
  t.deepEqual(before, after, 'Did not materially mutate process env vars (local)')
  await sandbox.end()
  cleanEnv(t)

  // Architect 6+ (staging/prod)
  before = copy(process.env)
  process.env.ARC_ENV = 'staging'
  process.env.ARC_SANDBOX = '{}' // Force aws-lite to disable keepalive
  await sandbox.start({ cwd: join(mock, 'normal'), port, quiet })
  after = copy(process.env)
  envVars.forEach(v => delete after[v])
  t.deepEqual(before, after, 'Did not materially mutate process env vars (staging)')
  await sandbox.end()
  cleanEnv(t)
})

test('Teardown', t => {
  t.plan(1)
  cleanEnv(t)
})
