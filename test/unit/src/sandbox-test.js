let test = require('tape')
let tiny = require('tiny-json-http')
let sandbox = require('../../../src')
let {join} = require('path')
let origCwd = process.cwd()
let url = 'http://localhost:6666'

// Verify sandbox shut down
let shutdown = (t, err) => {
  t.equal(err.code, 'ECONNREFUSED', 'Sandbox succssfully shut down')
}

test('Set up env', t => {
  t.plan(3)
  t.ok(sandbox, 'Found sandbox')
  t.ok(sandbox.start, 'Found sandbox.start')
  t.ok(sandbox.end, 'Found sandbox.end')
})

test('sandbox returns a Promise', async t => {
  t.plan(10)
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
    await tiny.get({url}) // Will fail; final test in catch block
  }
  catch (err) {
    if (err) shutdown(t, err)
    else t.fail(err)
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
    await tiny.get({url}) // Will fail; final test in catch block
  }
  catch (err) {
    if (err) shutdown(t, err)
    else t.fail(err)
  }
})

test('Sandbox uses continuation passing', t => {
  t.plan(7)

  // FYI: setTimeouts mostly jic to advance ticks and maybe give the sandbox time to start up / shut down between invocations
  setTimeout(() => {
    sandbox.start({}, (err, fn) => {
      if (err) t.fail(err)
      t.pass('sandbox.start executed callback (null params)')
      let end = fn
      let isFunction = end instanceof Function
      t.ok(isFunction, 'sandbox.start returned sandbox.end')
      end(() => {
        t.pass('Function returned by sandbox.start executed callback')
        tiny.get({url}, err => {
          if (err) shutdown(t, err)
          else t.fail('Sandbox did not shut down')
        })
      })
    })
  }, 50)

  setTimeout(() => {
    sandbox.start({port: 3333, options: [], version: ' '},
    () => (t.pass('sandbox.start executed callback (with params)')))
  }, 50)
  setTimeout(() => {
    sandbox.end(() => {
      t.pass('sandbox.end executed callback')
      tiny.get({url}, err => {
        if (err) shutdown(t, err)
        else t.fail('Sandbox did not shut down')
      })
    })
  }, 50)
})

// Standard Sandbox / AWS env vars to be populated
let envVars = [
  'ARC_CLOUDFORMATION',
  'ARC_HTTP',
  'ARC_QUIET',
  'ARC_STATIC_BUCKET',
  'ARC_WSS_URL',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'DEPRECATED',
  'NODE_ENV',
  'PORT',
  'SESSION_TABLE_NAME'
]
// TODO: tests for: ARC_SANDBOX_PATH_TO_STATIC, ARC_EVENTS_PORT, ARC_TABLES_PORT

function cleanEnv(t) {
  envVars.forEach(v => delete process.env[v])
  let isClean = envVars.some(v => !process.env[v])
  t.ok(isClean, 'Sandbox env vars cleaned')
}

test('sandbox has correct env vars populated', async t => {
  let roundsOfTesting = 3
  let tests = (roundsOfTesting * envVars.length) + (roundsOfTesting * 2)
  t.plan(tests)
  process.chdir(join(__dirname, '..', '..', 'mock', 'normal'))

  // Architect 6+ (local)
  try {
    cleanEnv(t)
    let end = await sandbox.start()
    envVars.forEach(v => {
      if (v === 'ARC_CLOUDFORMATION' || v === 'DEPRECATED')
        t.notOk(process.env[v], `${v} is not set`)
      else if (v !== 'ARC_QUIET')
        t.ok(process.env[v], `${v} present`)
      else if (v === 'ARC_QUIET')
        t.equal(process.env[v], '', `${v} is falsy`)
    })
    await end()
    await tiny.get({url}) // Will fail; final test in catch block
  }
  catch (err) {
    if (err) shutdown(t, err)
    else t.fail(err)
  }

  // Architect 6+ (staging)
  try {
    cleanEnv(t)
    process.env.NODE_ENV = 'staging'
    let end = await sandbox.start()
    envVars.forEach(v => {
      if (v === 'DEPRECATED')
        t.notOk(process.env[v], `${v} is not set`)
      else if (v !== 'ARC_QUIET')
        t.ok(process.env[v], `${v} present`)
      else if (v === 'ARC_QUIET')
        t.equal(process.env[v], '', `${v} is falsy`)
    })
    await end()
    await tiny.get({url}) // Will fail; final test in catch block
  }
  catch (err) {
    if (err) shutdown(t, err)
    else t.fail(err)
  }

  // Architect 6+ (production)
  try {
    cleanEnv(t)
    process.env.NODE_ENV = 'production'
    let end = await sandbox.start()
    envVars.forEach(v => {
      if (v === 'DEPRECATED')
        t.notOk(process.env[v], `${v} is not set`)
      else if (v !== 'ARC_QUIET')
        t.ok(process.env[v], `${v} present`)
      else if (v === 'ARC_QUIET')
        t.equal(process.env[v], '', `${v} is falsy`)
    })
    await end()
    await tiny.get({url}) // Will fail; final test in catch block
  }
  catch (err) {
    if (err) shutdown(t, err)
    else t.fail(err)
  }
})

test('sandbox (Architect v5) has correct env vars populated', async t => {
  let roundsOfTesting = 3
  let tests = (roundsOfTesting * envVars.length) + (roundsOfTesting * 2)
  t.plan(tests)
  process.chdir(join(__dirname, '..', '..', 'mock', 'normal'))

  // Architect 5 (local)
  try {
    cleanEnv(t)
    let end = await sandbox.start({version: 'Architect 5.x'})
    envVars.forEach(v => {
      if (v === 'ARC_CLOUDFORMATION')
        t.notOk(process.env[v], `${v} is not set`)
      else if (v !== 'ARC_QUIET')
        t.ok(process.env[v], `${v} present`)
      else if (v === 'ARC_QUIET')
        t.equal(process.env[v], '', `${v} is falsy`)
    })
    await end()
    await tiny.get({url}) // Will fail; final test in catch block
  }
  catch (err) {
    if (err) shutdown(t, err)
    else t.fail(err)
  }

  // Architect 5 (staging)
  try {
    cleanEnv(t)
    process.env.NODE_ENV = 'staging'
    let end = await sandbox.start({version: 'Architect 5.x'})
    envVars.forEach(v => {
      if (v === 'ARC_CLOUDFORMATION')
        t.notOk(process.env[v], `${v} is not set`)
      else if (v !== 'ARC_QUIET')
        t.ok(process.env[v], `${v} present`)
      else if (v === 'ARC_QUIET')
        t.equal(process.env[v], '', `${v} is falsy`)
    })
    await end()
    await tiny.get({url}) // Will fail; final test in catch block
  }
  catch (err) {
    if (err) shutdown(t, err)
    else t.fail(err)
  }

  // Architect 5 (production)
  try {
    cleanEnv(t)
    process.env.NODE_ENV = 'production'
    let end = await sandbox.start({version: 'Architect 5.x'})
    envVars.forEach(v => {
      if (v === 'ARC_CLOUDFORMATION')
        t.notOk(process.env[v], `${v} is not set`)
      else if (v !== 'ARC_QUIET')
        t.ok(process.env[v], `${v} present`)
      else if (v === 'ARC_QUIET')
        t.equal(process.env[v], '', `${v} is falsy`)
    })
    await end()
    await tiny.get({url}) // Will fail; final test in catch block
  }
  catch (err) {
    if (err) shutdown(t, err)
    else t.fail(err)
  }
})

test('Teardown', t => {
  t.plan(2)
  process.chdir(origCwd)
  t.equals(process.cwd(), origCwd)
  cleanEnv(t)
})
