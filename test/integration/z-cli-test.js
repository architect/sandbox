let cli = require('../../src/cli')
let { join } = require('path')
let test = require('tape')
let mock = join(__dirname, '..', 'mock')

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

test('CLI sandbox', t => {
  t.plan(1)
  cli({}, function done (err) {
    if (err) t.fail(err)
    else {
      t.pass('Sandbox CLI started')
      t.end()
      process.exit(0) // CLI holds process open, ofc
    }
  })
})
