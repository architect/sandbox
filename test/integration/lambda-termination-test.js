let test = require('tape')
let { existsSync, mkdirSync, readdirSync, rmSync } = require('fs')
let { join } = require('path')
let chokidar = require('chokidar')
let sandbox = require('../../src')
let mock = join(process.cwd(), 'test', 'mock')
let { run, startup, shutdown } = require('../utils')
let tmp = join(mock, 'tmp')
let fileThatShouldNotBeWritten = join(tmp, 'do-not-write-me')
let payload = { path: fileThatShouldNotBeWritten }
let eventsPort = 4444
let arc, watcher

// Generally we shouldn't need this long to test for a successfully timed-out Lambda
// However, lower-end CI VMs can take a while to do things like spawning the child processes needed to run tree-kill during Lambda termination
// In practice on modern dev machines Sandbox will terminate in a very timely fashion, but these tests must reliably run in CI, so we'll give it more time than is otherwise necessary
let timeout = 1250

// Because these tests are firing Arc Functions events, that module needs a `ARC_EVENTS_PORT` env var to run locally
// That said, to prevent side-effects, destroy that env var immediately after use
function setup (t) {
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true, maxRetries: 10 })
  mkdirSync(tmp, { recursive: true })
  t.ok(existsSync(tmp), 'Created tmp dir')
  process.env.ARC_ENV = 'testing'
  process.env.ARC_SANDBOX = JSON.stringify({ ports: { events: eventsPort }, version: '5.0.0' })
}
function reset (t) {
  rmSync(tmp, { recursive: true, force: true, maxRetries: 10 })
  t.notOk(existsSync(tmp), 'Destroyed tmp dir')
  delete process.env.ARC_ENV
  delete process.env.ARC_SANDBOX
}
function check (t, altTimeout) {
  setTimeout(() => {
    console.log('Files in tmp:', readdirSync(tmp))
    t.notOk(existsSync(fileThatShouldNotBeWritten), 'File not created as event timed out and process was terminated appropriately')
    reset(t)
  }, altTimeout || timeout)
}

test('Set up env', t => {
  t.plan(2)
  setup(t)
  // eslint-disable-next-line
  arc = require('@architect/functions')
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
    let timer

    watcher = chokidar.watch(tmp)
    watcher.on('add', function (added) {
      if (added === fine) {
        clearTimeout(timer)
        watcher.close().then(() => {
          console.log('Files in tmp:', readdirSync(tmp))
          t.pass('File successfully created by event as event did not time out')
          reset(t)
        })
      }
    })

    arc.events.publish({
      name: 'event-does-not-timeout',
      payload: { path: fine }
    },
    function done (err) {
      if (err) t.fail(err)
      else {
        let ohno = 10000
        timer = setTimeout(() => {
          t.fail(`Did not write file in ${ohno}ms, sigh`)
        }, ohno)
      }
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

  t.test(`${mode} Should terminate after return when process does not auto exit`, t => {
    t.plan(3)
    setup(t)
    arc.events.publish({
      name: 'event-no-exit-after-return',
      payload
    },
    function done (err) {
      if (err) t.fail(err)
      else check(t, 600)
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
