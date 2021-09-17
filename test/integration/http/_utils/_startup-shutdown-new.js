let { join } = require('path')
let { spawn } = require('child_process')
let sandbox = require('../../../../src')
let { url } = require('./_lib')
let tiny = require('tiny-json-http')
let mock = join(process.cwd(), 'test', 'mock')
let quiet = true
let child

// Verify sandbox shut down
let verifyShutdown = (t, type) => {
  tiny.get({ url }, err => {
    if (err) {
      let errs = [ 'ECONNREFUSED', 'ECONNRESET' ]
      delete process.env.ARC_QUIET // Must be reset on shutdown so we can verify binary startup
      t.ok(errs.includes(err.code), `Sandbox succssfully shut down (${type})`)
    }
    else t.fail('Sandbox did not shut down')
  })
}

let startup = {
  module: (t, mockDir) => {
    t.plan(2)
    sandbox.start({
      cwd: join(mock, mockDir),
      quiet,
    }, (err, result) => {
      if (err) t.fail(err)
      else {
        t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
        t.equal(result, 'Sandbox successfully started', 'Sandbox started (module)')
      }
    })
  },
  binary: (t, mockDir) => {
    t.plan(2)
    if (child) throw Error('Unclean test env, found hanging child process!')
    let cwd = join(mock, mockDir)
    child = spawn(`${process.cwd()}/bin/sandbox-binary`, [], { cwd })
    t.ok(child, 'Sandbox child process started')
    let data = ''
    let started = false
    child.stdout.on('data', chunk => {
      data += chunk.toString()
      if (data.includes('Sandbox Started in') && !started) {
        started = true
        if (!quiet) { console.log(data) }
        t.pass('Sandbox started (binary)')
      }
    })
  }
}

let shutdown = {
  module: (t, setPlan = true) => {
    if (setPlan) t.plan(1)
    sandbox.end((err, result) => {
      if (err) t.fail(err)
      if (result !== 'Sandbox successfully shut down') {
        t.fail('Did not get back Sandbox shutdown message')
      }
      verifyShutdown(t, 'module')
    })
  },
  binary: (t, setPlan = true) => {
    if (setPlan) t.plan(1)
    child.kill('SIGINT')
    // Child processes can take a bit to shut down
    // If we don't confirm it's exited, the next test may try to start a second Sandbox and blow everything up
    let tries = 0
    function check () {
      if (child.exitCode === null && tries <= 10) {
        tries++
        setTimeout(check, 25)
      }
      else if (child.exitCode === null) {
        throw Error(`Could not exit Sandbox binary child process (${child.pid})`)
      }
      else {
        child = undefined
        verifyShutdown(t, 'binary')
      }
    }
    check()
  }
}

let teardown = {
  module: t => {
    t.plan(2)
    delete process.env.ARC_QUIET
    t.notOk(process.env.ARC_QUIET, 'ARC_QUIET not set')
    shutdown.module(t, false)
  },
  binary: t => {
    t.plan(2)
    delete process.env.ARC_QUIET
    t.notOk(process.env.ARC_QUIET, 'ARC_QUIET not set')
    shutdown.binary(t, false)
  }
}

module.exports = {
  verifyShutdownNew: verifyShutdown,
  startupNew: startup,
  shutdownNew: shutdown,
  teardown,
}
