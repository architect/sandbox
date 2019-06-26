let join = require('path').join
let test = require('tape')
let exists = require('fs').existsSync
let spawn = require('child_process').spawn

/**
 * May take a few seconds to close all related threads
 * Test may fail if re-run quickly, or fail others by not releasing ports, etc. if not run last
 */
test('CLI env', t=> {
  t.plan(1)
  // Assumes previous tests may have already set working dir to `mock`
  process.chdir(join(__dirname, 'mock'))
  t.ok(exists(join(process.cwd(), '..', '..', 'src', 'cli', 'cli.js')), 'Has CLI')
})

test('CLI sandbox', t => {
  t.plan(1)
  let result = spawn('../../src/cli/cli.js')
  let output = ''
  result.stdout.on('data', (data) => {
    output += data
    if (output.includes(`Local environment ready!`)) {
      console.log(output)
      result.kill('SIGTERM')
      t.ok(true, 'Sandbox CLI started')
    }
  })
  result.on('error', err => {
    t.fail(err)
  })
})
