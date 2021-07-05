let arc = require('@architect/functions')
let test = require('tape')
// let http = require('http')
let { existsSync, mkdirSync, readdirSync /* readFileSync, statSync */ } = require('fs')
let { join } = require('path')
let { events } = require('../../src')
let { sync: rm } = require('rimraf')
let mock = join(process.cwd(), 'test', 'mock')

let tmp = join(mock, 'tmp')
let fileThatShouldNotBeWritten = join(tmp, 'do-not-write-me')
let payload = { path: fileThatShouldNotBeWritten }
let timeout = 1250

function setup (t) {
  if (existsSync(tmp)) rm(tmp)
  mkdirSync(tmp, { recursive: true })
  t.ok(existsSync(tmp), 'Created tmp dir')
}
function reset (t) {
  rm(tmp)
  t.notOk(existsSync(tmp), 'Destroyed tmp dir')
}
function check (t) {
  setTimeout(() => {
    console.log('Files in tmp:', readdirSync(tmp))
    t.notOk(existsSync(fileThatShouldNotBeWritten), 'File not created as event timed out and process was terminated appropriately')
    reset(t)
  }, timeout)
}

test('Set up env', t => {
  t.plan(2)
  t.ok(events, 'Events module is present')
  events.start({ cwd: join(mock, 'lambda-termination'), logLevel: 'debug' }, (err, result) => {
    if (err) t.fail(err)
    else t.equal(result, 'Event bus successfully started', 'Events started (async)')
  })
})

// Control test: if you change lambda invocation logic, this should pass!
test('[Lambda invocation] Should not terminate a process early', t => {
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

test('[Lambda invocation] Respect timeout for async functions and kill process', t => {
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

test('[Lambda invocation] Respect timeout for async functions and kill process + spawned children', t => {
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

test('[Lambda invocation] Respect timeout for async functions and kill process (with logic inside setTimeout)', t => {
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

test('[Lambda invocation] Respect timeout for sync functions and kill process', t => {
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

test('[Lambda invocation] Respect timeout for sync functions and kill process + spawned children', t => {
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

test('[Lambda invocation] Respect timeout for sync functions and kill process + spawned children (inside a Lambda via Linux /proc)', t => {
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

test('Sync events.end', t => {
  t.plan(1)
  delete process.env.AWS_LAMBDA_FUNCTION_NAME
  events.end(function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Event bus successfully shut down', 'Events ended')
  })
})
