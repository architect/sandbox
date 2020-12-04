let cli = require('../../src/cli')
let { join } = require('path')
let test = require('tape')
let mock = join(__dirname, '..', 'mock')
let tiny = require('tiny-json-http')

/**
 * May take a few seconds to close all related threads
 * Test may fail if re-run quickly, or fail others by not releasing ports, etc. if not run last
 */
test('Set up env', t => {
  t.plan(1)
  // Assumes previous tests may have already set working dir to `mock`
  process.chdir(join(mock, 'normal'))
  t.ok(cli, 'CLI is present')
})

const cliInv = {
  inv: {
    _project: { manifest: {} }
  }
}

function doesIndexRouteWork (port, close, t) {
  tiny.get({ url: `http://localhost:${port}/` }, function (e, res) {
    if (e) t.fail(e)
    else {
      t.equals(res.body.message, 'Hello from get / running the default runtime', 'correct response from http server')
      close()
      t.end()
    }
  })
}

test('CLI sandbox, no params', t => {
  t.plan(1)
  cli({ inventory: cliInv }, function done (err, close) {
    if (err) t.fail(err)
    else doesIndexRouteWork(process.env.PORT || 3333, close, t)
  })
})

test('CLI sandbox, port specified', t => {
  t.plan(1)
  cli({ inventory: cliInv, options: [ '-p', '5432' ] }, function done (err, close) {
    if (err) t.fail(err)
    else doesIndexRouteWork(5432, close, t)
  })
})
