let arc = require('@architect/functions')
let test = require('tape')
let { join } = require('path')
let { events } = require('../../src')
let cwd = process.cwd()
let mock = join(__dirname, '..', 'mock')

test('Set up env', t => {
  t.plan(1)
  t.ok(events, 'Events module is present')
  process.chdir(join(mock, 'normal'))
})

test('Async events.start', async t => {
  t.plan(1)
  try {
    let result = await events.start({ quiet: true })
    t.equal(result, 'Event bus successfully started', 'Events started (async)')
  }
  catch (err) {
    t.fail(err)
  }
})

test('arc.events.publish', t => {
  t.plan(1)
  arc.events.publish({
    name: 'ping',
    payload: {
      yay: true,
      yas: 'queen'
    }
  },
  function done (err) {
    if (err) t.fail(err)
    else t.pass('Successfully published event')
  })
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
  events.start({ quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Event bus successfully started', 'Events started (sync)')
  })
})

test('arc.queues.publish', t => {
  t.plan(1)
  arc.queues.publish({
    name: 'pong',
    payload: {
      most: 'bes'
    }
  },
  function done (err) {
    if (err) t.fail(err)
    else t.pass('Successfully published queue')
  })
})

test('Sync events.end', t => {
  t.plan(2)
  setTimeout(() => {
    events.end(function (err, result) {
      if (err) t.fail(err)
      else {
        t.equal(result, 'Event bus successfully shut down', 'Events ended')
        process.chdir(cwd)
        t.equal(process.cwd(), cwd, 'Switched back to original working dir')
      }
    })
  }, 100)
})
