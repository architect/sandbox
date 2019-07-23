let cli = require('../../src/cli')
let join = require('path').join
let test = require('tape')

/**
 * May take a few seconds to close all related threads
 * Test may fail if re-run quickly, or fail others by not releasing ports, etc. if not run last
 */
test('CLI env', t=> {
  t.plan(1)
  // Assumes previous tests may have already set working dir to `mock`
  process.chdir(join(__dirname, '..', 'mock', 'normal'))
  t.ok(cli, 'Has CLI')
})

test('CLI sandbox', t => {
  t.plan(1)
  cli({}, function done (err, close) {
    if (err) t.fail(err)
    else {
      if (close) close()
      t.ok(true, 'Sandbox CLI started')
      t.end()
      process.exit(0) // CLI holds process open, ofc
    }
  })
})
