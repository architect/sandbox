let arc = require('@architect/functions')
let test = require('tape')
let { existsSync, mkdirSync, readdirSync } = require('fs')
let { join } = require('path')
let sandbox = require('../../src')
let { sync: rm } = require('rimraf')
let mock = join(process.cwd(), 'test', 'mock')
let { port, run, startup, shutdown } = require('../utils')
let { getPorts } = require(join(process.cwd(), 'src', 'lib', 'ports'))
let tmp = join(mock, 'tmp')
let fileThatShouldNotBeWritten = join(tmp, 'do-not-write-me')
let payload = { path: fileThatShouldNotBeWritten }
let timeout = 1250

// Because these tests are firing Arc Functions events, that module needs a `ARC_EVENTS_PORT` env var to run locally
// That said, to prevent side-effects, destroy that env var immediately after use
function setup (t) {
  if (existsSync(tmp)) rm(tmp)
  mkdirSync(tmp, { recursive: true })
  t.ok(existsSync(tmp), 'Created tmp dir')
  let { eventsPort } = getPorts(port)
  process.env.ARC_EVENTS_PORT = eventsPort
  if (!process.env.ARC_EVENTS_PORT) t.fail('ARC_EVENTS_PORT should be set')
}
function reset (t) {
  rm(tmp)
  t.notOk(existsSync(tmp), 'Destroyed tmp dir')
  delete process.env.ARC_EVENTS_PORT
  if (process.env.ARC_EVENTS_PORT) t.fail('ARC_EVENTS_PORT should not be set')
}
function check (t) {
  setTimeout(() => {
    console.log('Files in tmp:', readdirSync(tmp))
    t.notOk(existsSync(fileThatShouldNotBeWritten), 'File not created as event timed out and process was terminated appropriately')
    reset(t)
  }, timeout)
}

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Sandbox is present')
})

test('Run Lambda termination tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  let mode = `[Lambda termination / ${runType}]`

  t.test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'lambda-termination')
  })

  // Control test: if you change lambda invocation logic, this should pass!
  t.test(`${mode} Should not terminate a process early`, t => {
    t.plan(3)
    setup(t)
    let fine = join(tmp, 'fine-write-me')
    arc.events.publish({
      name: 'event-does-not-timeout',
      payload: { path: fine }
    },
    function done (err) {
      if (err) t.fail(err)
      else setTimeout(() => {
        console.log('Files in tmp:', readdirSync(tmp))
        t.ok(existsSync(fine), 'File successfully created by event as event did not time out')
        reset(t)
      }, 1000)
    })
  })

  t.test(`${mode} Respect timeout for async functions and kill process`, t => {
    t.plan(3)
    setup(t)
    arc.events.publish({
      name: 'event-timeout-async',
      payload
    },
    function done (err) {
      if (err) t.fail(err)
      else check(t)
    })
  })

  t.test(`${mode} Respect timeout for async functions and kill process + spawned children`, t => {
    t.plan(3)
    setup(t)
    arc.events.publish({
      name: 'event-timeout-async-child',
      payload
    },
    function done (err) {
      if (err) t.fail(err)
      else check(t)
    })
  })

  t.test(`${mode} Respect timeout for async functions and kill process (with logic inside setTimeout)`, t => {
    // See: #1137
    t.plan(3)
    setup(t)
    arc.events.publish({
      name: 'event-timeout-async-settimeout',
      payload
    },
    function done (err) {
      if (err) t.fail(err)
      else check(t)
    })
  })

  t.test(`${mode} Respect timeout for sync functions and kill process`, t => {
    t.plan(3)
    setup(t)
    arc.events.publish({
      name: 'event-timeout-sync',
      payload
    },
    function done (err) {
      if (err) t.fail(err)
      else check(t)
    })
  })

  t.test(`${mode} Respect timeout for sync functions and kill process + spawned children`, t => {
    t.plan(3)
    setup(t)
    arc.events.publish({
      name: 'event-timeout-sync-child',
      payload
    },
    function done (err) {
      if (err) t.fail(err)
      else check(t)
    })
  })

  t.test(`${mode} Respect timeout for sync functions and kill process + spawned children (inside a Lambda via Linux /proc)`, t => {
    let isLinux = process.platform === 'linux'
    if (isLinux) {
      t.plan(3)
      setup(t)
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'yep'
      arc.events.publish({
        name: 'event-timeout-sync-child',
        payload
      },
      function done (err) {
        if (err) t.fail(err)
        else check(t)
      })
    }
    else {
      t.plan(1)
      t.pass('Skipped because !Linux')
    }
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
