let arc = require('@architect/functions')
let test = require('tape')
let http = require('http')
let { existsSync, mkdirSync, readFileSync, statSync } = require('fs')
let { join } = require('path')
let { events } = require('../../src')
let { sync: rm } = require('rimraf')
let mock = join(process.cwd(), 'test', 'mock')
let tmp = join(mock, 'tmp')

function setup (t) {
  if (existsSync(tmp)) rm(tmp)
  mkdirSync(tmp, { recursive: true })
  t.ok(existsSync(tmp), 'Created tmp dir')
}
function teardown (t) {
  rm(tmp)
  t.notOk(existsSync(tmp), 'Destroyed tmp dir')
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

test('Async events.start', async t => {
  t.plan(1)
  try {
    let result = await events.start({ cwd: join(mock, 'normal'), quiet: true })
    t.equal(result, 'Event bus successfully started', 'Events started (async)')
  }
  catch (err) {
    t.fail(err)
  }
})

test('arc.events.publish (normal)', t => {
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

test('arc.events.publish (custom)', t => {
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

test('arc.events.publish (failure)', t => {
  t.plan(1)
  arc.events.publish({
    name: 'invalid-event',
    payload: {}
  },
  function done (err) {
    if (err) t.match(err.message, /404/, 'Event not found')
    else t.fail('Publish should have failed')
  })
})

test('random HTTP request to event bus with malformed JSON should return an HTTP 400 error', t => {
  t.plan(2)
  let port = process.env.ARC_EVENTS_PORT || 3334
  let req = http.request({
    method: 'POST',
    port,
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

test('Async events.end', async t => {
  t.plan(1)
  try {
    let ended = await events.end()
    t.equal(ended, 'Event bus successfully shut down', 'Events ended')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Sync events.start', t => {
  t.plan(1)
  events.start({ cwd: join(mock, 'normal'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Event bus successfully started', 'Events started (sync)')
  })
})

test('arc.queues.publish (normal)', t => {
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

test('arc.queues.publish (custom)', t => {
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

test('arc.queues.publish (failure)', t => {
  t.plan(1)
  arc.queues.publish({
    name: 'invalid-queue',
    payload: {}
  },
  function done (err) {
    if (err) t.match(err.message, /404/, 'Event not found')
    else t.fail('Publish should have failed')
  })
})

test('invoke-lambda should respect timeout for async functions and process should be killed', t => {
  t.plan(1)
  let fileThatShouldNotBeWritten = join(tmp, 'foo-async')
  arc.events.publish({
    name: 'event-timeout-async',
    payload: { path: fileThatShouldNotBeWritten }
  },
  function done (err) {
    if (err) t.fail(err)
    else setTimeout(() => {
      t.notOk(existsSync(fileThatShouldNotBeWritten), 'file not created by event as event timed out and process was terminated appropriately')
    }, 1250) // 1s is the configured timeout of test/mock/normal/src/events/event-timeout-async so we pad it a bit and check after delay
  })
})

test('invoke-lambda should respect timeout for async functions (even if they include a settimeout within them) and process should be killed', t => {
  t.plan(1)
  let fileThatShouldNotBeWritten = join(tmp, 'foo-async-settimeout')
  arc.events.publish({
    name: 'event-timeout-async-w-settimeout',
    payload: { path: fileThatShouldNotBeWritten }
  },
  function done (err) {
    if (err) t.fail(err)
    else setTimeout(() => {
      t.notOk(existsSync(fileThatShouldNotBeWritten), 'file not created by event as event timed out and process was terminated appropriately')
    }, 1250) // 1s is the configured timeout of test/mock/normal/src/events/event-timeout-async-w-timeout so we pad it a bit and check after delay
  })
})

test('invoke-lambda should respect timeout for sync functions and process should be killed', t => {
  t.plan(1)
  let fileThatShouldNotBeWritten = join(tmp, 'foo-sync')
  arc.events.publish({
    name: 'event-timeout-sync',
    payload: { path: fileThatShouldNotBeWritten }
  },
  function done (err) {
    if (err) t.fail(err)
    else setTimeout(() => {
      t.notOk(existsSync(fileThatShouldNotBeWritten), 'file not created by event as event timed out and process was terminated appropriately')
    }, 1250) // 1s is the configured timeout of test/mock/normal/src/events/event-timeout-sync so we pad it a bit and check after delay
  })
})

test('invoke-lambda should respect timeout for sync functions and process should be killed (inside actual AWS Lambda)', t => {
  let isLinux = process.platform === 'linux'
  t.plan(1)
  if (isLinux) {
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'yep'
    let fileThatShouldNotBeWritten = join(tmp, 'foo-sync')
    arc.events.publish({
      name: 'event-timeout-sync',
      payload: { path: fileThatShouldNotBeWritten }
    },
    function done (err) {
      if (err) t.fail(err)
      else setTimeout(() => {
        t.notOk(existsSync(fileThatShouldNotBeWritten), 'file not created by event as event timed out and process was terminated appropriately')
      }, 1250) // 1s is the configured timeout of test/mock/normal/src/events/event-timeout-sync so we pad it a bit and check after delay
    })
  }
  else t.pass('Skipped because !Linux')
})

test('Sync events.end', t => {
  t.plan(1)
  delete process.env.AWS_LAMBDA_FUNCTION_NAME
  events.end(function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Event bus successfully shut down', 'Events ended')
  })
})
