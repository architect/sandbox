let { join } = require('path')
let { existsSync } = require('fs')
let { spawn } = require('child_process')
let test = require('tape')
let { shutdown, verifyShutdown } = require('../utils')
let cli = join(process.cwd(), 'src', 'cli', 'cli.js')
let mock = join(process.cwd(), 'test', 'mock')

test('Set up env', t => {
  t.plan(1)
  t.ok(existsSync(cli), 'CLI is present')
})

test('Sandbox CLI interface', t => {
  t.plan(4)
  let child = spawn('node', [ cli ], { cwd: join(mock, 'normal') })
  t.ok(child, 'Sandbox child process started')
  let data = ''
  let started = false
  let watcher = false
  child.stdout.on('data', chunk => {
    data += chunk.toString()
    if (data.includes('Sandbox Started in') && !started) {
      started = true
      t.pass('Sandbox started')
    }
    // This is not an adequate fully-integrated file watcher test, but it is massively easier to test the watcher via its own interface than via the CLI, so here we are
    if (data.includes('File watcher now looking for project changes') && !watcher) {
      watcher = true
      t.pass('Sandbox file watcher started')
      // Windows doesn't terminate child processes nicely, so yet another special case for that very special OS
      if (process.platform.startsWith('win')) {
        child.kill('SIGINT')
        verifyShutdown(t, 'CLI interface')
      }
      else {
        shutdown['binary'](t, { planAdd: 3, child })
      }
    }
  })
})
