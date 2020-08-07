let arc = require('@architect/functions')
let test = require('tape')
let path = require('path')
let { events } = require('../../src')
let cwd = process.cwd()

test('events.start', t => {
  t.plan(2)
  t.ok(events, 'events')
  // ensure we are testing
  process.env.NODE_ENV = 'testing'
  // move to test/mock
  process.chdir(path.join(__dirname, '..', 'mock', 'normal'))
  events.start({}, function () {
    t.ok(true, '@events mounted')
  })
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
    else {
      t.ok(true, 'published')
    }
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
    else {
      t.ok(true, 'published')
    }
  })
})

test('events.end', t => {
  t.plan(2)
  setTimeout(() => {
    events.end(function ended (err) {
      if (err) t.fail(err)
      else {
        t.pass('@events ended')
        process.chdir(cwd)
        t.equal(process.cwd(), cwd, 'Switched back to original working dir')
      }
    })
  }, 100)
})
