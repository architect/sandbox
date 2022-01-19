let arc = require('@architect/functions')
let test = require('tape')
let http = require('http')
let { existsSync, mkdirSync, readFileSync, rmSync, statSync } = require('fs')
let { join } = require('path')
let { events } = require('../../src')
let mock = join(process.cwd(), 'test', 'mock')
let tmp = join(mock, 'tmp')
let { port, quiet, _refreshInventory, run, startup, shutdown } = require('../utils')
let eventsPort = 4444

// Because these tests are firing Arc Functions events, that module needs a `ARC_EVENTS_PORT` env var to run locally
// That said, to prevent side-effects, destroy that env var immediately after use
function setup (t) {
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true, maxRetries: 10 })
  mkdirSync(tmp, { recursive: true })
  t.ok(existsSync(tmp), 'Created tmp dir')
  process.env.ARC_EVENTS_PORT = eventsPort
  if (!process.env.ARC_EVENTS_PORT) t.fail('ARC_EVENTS_PORT should be set')
}
function teardown (t) {
  rmSync(tmp, { recursive: true, force: true, maxRetries: 10 })
  t.notOk(existsSync(tmp), 'Destroyed tmp dir')
  delete process.env.ARC_EVENTS_PORT
  if (process.env.ARC_EVENTS_PORT) t.fail('ARC_EVENTS_PORT should not be set')
}

// Check for the event artifact up to 10 times over 1 second or fail
function checkFile (t, file, message) {
  let found = false
  let now = new Date()
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      let exists = existsSync(file)
      if (i === 9 && !found && !exists) {
        t.fail('Failed to find file proving event ran')
      }
      else if (found) return
      else if (exists) {
        let stats = statSync(file)
        if (stats.size > 0) {
          found = true
          t.pass('Found file proving event ran')
          let contents = readFileSync(file).toString()
          t.equal(contents, message, `Found correct file contents in ${new Date() - now}ms`)
          teardown(t)
        }
      }
    }, i * 100)
  }
}

test('Set up env', t => {
  t.plan(1)
  t.ok(events, 'Events module is present')
})

test('Run events tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  let mode = `[Events / ${runType}]`

  t.test(`${mode} Async events.start`, async t => {
    if (runType === 'module') {
      t.plan(1)
      try {
        let result = await events.start({ cwd: join(mock, 'normal'), port, quiet, _refreshInventory })
        t.equal(result, 'Event bus successfully started', 'Events started (async)')
      }
      catch (err) {
        t.fail(err)
      }
    }
    else await startup[runType].async(t, 'normal')
  })

  t.test(`${mode} arc.events.publish (normal)`, t => {
    t.plan(5)
    setup(t)
    let filename = 'event-file-normal'
    let message = 'Event completed (normal)'
    arc.events.publish({
      name: 'event-normal',
      payload: { filename, message }
    },
    function done (err) {
      if (err) t.fail(err)
      else {
        t.pass('Successfully published event')
        let file = join(tmp, filename)
        checkFile(t, file, message)
      }
    })
  })

  t.test(`${mode} arc.events.publish (custom)`, t => {
    t.plan(5)
    setup(t)
    let filename = 'event-file-custom'
    let message = 'Event completed (custom)'
    arc.events.publish({
      name: 'event-custom',
      payload: { filename, message }
    },
    function done (err) {
      if (err) t.fail(err)
      else {
        t.pass('Successfully published event')
        let file = join(tmp, filename)
        checkFile(t, file, message)
      }
    })
  })

  t.test(`${mode} arc.events.publish (failure)`, t => {
    t.plan(3)
    setup(t)
    arc.events.publish({
      name: 'invalid-event',
      payload: {}
    },
    function done (err) {
      if (err) {
        t.match(err.message, /404/, 'Event not found')
        teardown(t)
      }
      else t.fail('Publish should have failed')
    })
  })

  t.test(`${mode} Random HTTP request to event bus with malformed JSON should return an HTTP 400 error`, t => {
    t.plan(2)
    let req = http.request({
      method: 'POST',
      port: eventsPort,
      path: '/'
    }, function done (res) {
      let data = ''
      res.resume()
      res.on('data', chunk => data += chunk.toString())
      res.on('end', () => {
        t.equals(res.statusCode, 400, 'HTTP responded with 400 code ')
        t.equals(data, 'Sandbox @event bus exception parsing request body', 'HTTP responded with detailed error message')
      })
    })
    req.write('hello, is it me you\'re looking for?')
    req.end('\n')
  })

  t.test(`${mode} Async events.end`, async t => {
    if (runType === 'module') {
      t.plan(1)
      try {
        let ended = await events.end()
        t.equal(ended, 'Event bus successfully shut down', 'Events ended')
      }
      catch (err) {
        t.fail(err)
      }
    }
    else await shutdown[runType].async(t)
  })

  t.test(`${mode} Sync events.start`, t => {
    if (runType === 'module') {
      t.plan(1)
      events.start({ cwd: join(mock, 'normal'), port, quiet, _refreshInventory }, function (err, result) {
        if (err) t.fail(err)
        else t.equal(result, 'Event bus successfully started', 'Events started (sync)')
      })
    }
    else startup[runType](t, 'normal')
  })

  t.test(`${mode} arc.queues.publish (normal)`, t => {
    t.plan(5)
    setup(t)
    let filename = 'queue-file-normal'
    let message = 'Queue completed (normal)'
    arc.queues.publish({
      name: 'queue-normal',
      payload: { filename, message }
    },
    function done (err) {
      if (err) t.fail(err)
      else {
        t.pass('Successfully published queue')
        let file = join(tmp, filename)
        checkFile(t, file, message)
      }
    })
  })

  t.test(`${mode} arc.queues.publish (custom)`, t => {
    t.plan(5)
    setup(t)
    let filename = 'queue-file-custom'
    let message = 'Queue completed (custom)'
    arc.queues.publish({
      name: 'queue-custom',
      payload: { filename, message }
    },
    function done (err) {
      if (err) t.fail(err)
      else {
        t.pass('Successfully published queue')
        let file = join(tmp, filename)
        checkFile(t, file, message)
      }
    })
  })

  t.test(`${mode} arc.queues.publish (failure)`, t => {
    t.plan(3)
    setup(t)
    arc.queues.publish({
      name: 'invalid-queue',
      payload: {}
    },
    function done (err) {
      if (err) {
        t.match(err.message, /404/, 'Event not found')
        teardown(t)
      }
      else t.fail('Publish should have failed')
    })
  })

  t.test(`${mode} Sync events.end`, t => {
    if (runType === 'module') {
      t.plan(1)
      events.end(function (err, result) {
        if (err) t.fail(err)
        else t.equal(result, 'Event bus successfully shut down', 'Events ended')
      })
    }
    else shutdown[runType](t)
  })
}
