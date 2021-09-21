let { join } = require('path')
let { existsSync } = require('fs')
let { spawn } = require('child_process')
let test = require('tape')
let { shutdownNew: shutdown, verifyShutdownNew: verifyShutdown } = require('../utils')
let cli = join(process.cwd(), 'src', 'cli', 'cli.js')
let mock = join(process.cwd(), 'test', 'mock', 'normal')

/**
 * May take a few seconds to close all related threads
 * Test may fail if re-run quickly, or fail others by not releasing ports, etc. if not run last
 */
test('Set up env', t => {
  t.plan(1)
  t.ok(existsSync(cli), 'CLI is present')
})

test('Sandbox CLI interface', t => {
  t.plan(3)
  let child = spawn('node', [ cli ], { cwd: mock })
  t.ok(child, 'Sandbox child process started')
  let data = ''
  let started = false
  child.stdout.on('data', chunk => {
    data += chunk.toString()
    if (data.includes('Sandbox Started in') && !started) {
      started = true
      t.pass('Sandbox started (binary)')
      // Windows doesn't terminate child processes nicely, so yet another special case for that very special OS
      if (process.platform.startsWith('win')) {
        child.kill('SIGINT')
        verifyShutdown(t, 'CLI interface')
      }
      else {
        shutdown['binary'](t, { planAdd: 2, child })
      }
    }
  })
})
