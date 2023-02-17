let test = require('tape')
let http = require('http')
let { existsSync, mkdirSync, readFileSync, rmSync } = require('fs')
let { join } = require('path')
let chokidar = require('chokidar')
let sandbox = require('../../src')
let mock = join(process.cwd(), 'test', 'mock')
let tmp = join(mock, 'tmp')
let { run, startup, shutdown } = require('../utils')
let eventsPort = 4444
let ohno = 10000
let arc

// Because these tests are firing Arc Functions events, that module needs a `ARC_EVENTS_PORT` env var to run locally
// That said, to prevent side-effects, destroy that env var immediately after use
function setup (t) {
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true, maxRetries: 10 })
  mkdirSync(tmp, { recursive: true })
  t.ok(existsSync(tmp), 'Created tmp dir')
  process.env.ARC_ENV = 'testing'
  process.env.ARC_SANDBOX = JSON.stringify({ ports: { events: eventsPort }, version: '5.0.0' })
}
function teardown (t) {
  rmSync(tmp, { recursive: true, force: true, maxRetries: 10 })
  t.notOk(existsSync(tmp), 'Destroyed tmp dir')
  delete process.env.ARC_ENV
  delete process.env.ARC_SANDBOX
}

// Wait for the event artifact to appear or fail after 10 seconds
function verifyPublish ({ t, pragma, event, file, message }) {
  let filename = join(tmp, file)
  let timer
  let now = new Date()
  let watcher = chokidar.watch(tmp, {
    awaitWriteFinish: {
      stabilityThreshold: 150,
      pollInterval: 50,
    },
  })
  watcher.on('add', function (added) {
    if (added === filename) {
      clearTimeout(timer)
      watcher.close().then(() => {
        let contents = readFileSync(filename).toString()
        t.equal(contents, message, `Found correct file contents in ${new Date() - now}ms`)
        teardown(t)
      })
    }
  })

  arc[pragma].publish({
    name: event,
    payload: { filename: file, message },
  }, function done (err) {
    if (err) t.fail(err)
    else {
      t.pass('Successfully published event')
      timer = setTimeout(() => {
        t.fail(`Did not write file in ${ohno}ms, sigh`)
      }, ohno)
    }
  })
}

test('Set up env', t => {
  t.plan(2)
  setup(t)
  // eslint-disable-next-line
  arc = require('@architect/functions')
  t.ok(sandbox, 'Got Sandbox')
})

test('Run events tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  let mode = `[Events / ${runType}]`

  t.test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'normal')
  })

  t.test(`${mode} arc.events.publish (normal)`, t => {
    t.plan(4)
    setup(t)
    verifyPublish({
      t,
      pragma: 'events',
      event: 'event-normal',
      file: 'event-file-normal',
      message: 'Event completed (normal)',
    })
  })

  t.test(`${mode} arc.events.publish (custom)`, t => {
    t.plan(4)
    setup(t)
    verifyPublish({
      t,
      pragma: 'events',
      event: 'event-custom',
      file: 'event-file-custom',
      message: 'Event completed (custom)',
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

  t.test(`${mode} arc.queues.publish (normal)`, t => {
    t.plan(4)
    setup(t)
    verifyPublish({
      t,
      pragma: 'queues',
      event: 'queue-normal',
      file: 'event-file-normal',
      message: 'Queue completed (normal)',
    })
  })

  t.test(`${mode} arc.queues.publish (custom)`, t => {
    t.plan(4)
    setup(t)
    verifyPublish({
      t,
      pragma: 'queues',
      event: 'queue-custom',
      file: 'queue-file-custom',
      message: 'Queue completed (custom)',
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

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
