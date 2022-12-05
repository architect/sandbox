let { join } = require('path')
let { spawn } = require('child_process')
let sandbox = require('../../src')
let { port, quiet, url } = require('./_lib')
let tiny = require('tiny-json-http')
let mock = join(process.cwd(), 'test', 'mock')
let child
let data = ''

let startup = {
  module: (t, mockDir, options = {}, callback) => {
    let { planAdd = 0, print } = options
    t.plan(1 + planAdd)
    sandbox.start({
      cwd: join(mock, mockDir),
      port,
      quiet: print !== undefined ? false : quiet,
      ...options,
    }, (err, result) => {
      if (err) t.fail(err)
      else {
        t.equal(result, 'Sandbox successfully started', 'Sandbox started (module)')
        if (callback) callback()
      }
    })
  },
  binary: (t, mockDir, options = {}, callback) => {
    let { planAdd = 0, print, confirmStarted = 'Sandbox Started in' } = options
    t.plan(2 + planAdd)
    if (child) throw Error('Unclean test env, found hanging child process!')
    let cwd = join(mock, mockDir)
    // Quiet overrides are a bit more abstracted here bc we have to print from a child
    child = spawn(`${process.cwd()}/bin/sandbox-binary`, [], {
      cwd,
      env: {
        ARC_API_TYPE: options.apigateway,
        PORT: port,
        ...process.env
      }
    })
    t.ok(child, 'Sandbox child process started')
    let started = false
    child.stdout.on('data', chunk => {
      data += chunk.toString()
      if ((print || !quiet) && started) { console.log(chunk.toString()) }
      if (data.includes(confirmStarted) && !started) {
        started = true
        if (print || !quiet) { console.log(data) }
        t.pass('Sandbox started (binary)')
        if (callback) callback()
      }
    })
    child.stderr.on('data', chunk => {
      data += chunk.toString()
    })
    child.on('error', err => {
      t.fail(err)
    })
  }
}

let shutdown = {
  module: (t, options = {}, callback) => {
    let { planAdd = 0 } = options
    t.plan(1 + planAdd)
    sandbox.end((err, result) => {
      if (err) t.fail(err)
      if (result !== 'Sandbox successfully shut down') {
        t.fail('Did not get back Sandbox shutdown message')
      }
      verifyShutdown(t, 'module', callback)
    })
  },
  binary: (t, options = {}, callback) => {
    let { planAdd = 0, child: anotherChild } = options
    t.plan(1 + planAdd)
    let proc = anotherChild || child
    proc.stdin.write('\u0003')
    proc.stdin.end()
    // Child processes can take a bit to shut down
    // If we don't confirm it's exited, the next test may try to start a second Sandbox and blow everything up
    let tries = 0
    function check () {
      if (proc.exitCode === null && tries <= 10) {
        tries++
        setTimeout(check, 25)
      }
      else if (proc.exitCode === null) {
        throw Error(`Could not exit Sandbox binary child process (${proc.pid})`)
      }
      else {
        anotherChild = child = undefined
        data = ''
        verifyShutdown(t, 'binary', callback)
      }
    }
    check()
  }
}

let asyncify = obj => {
  Object.keys(obj).forEach(type => {
    obj[type].async = (...params) => new Promise((resolve, reject) => {
      try {
        obj[type](...params, resolve)
      }
      catch (err){
        reject(err)
      }
    })
  })
}
asyncify(startup)
asyncify(shutdown)

// Verify sandbox shut down
let verifyShutdown = (t, type, callback) => {
  tiny.get({ url }, err => {
    if (err) {
      let errs = [ 'ECONNREFUSED', 'ECONNRESET' ]
      t.ok(errs.includes(err.code), `Sandbox successfully shut down (${type})`)
      if (callback) callback()
    }
    else t.fail('Sandbox did not shut down')
  })
}
verifyShutdown.async = (...params) => new Promise((resolve, reject) => {
  try {
    verifyShutdown(...params, resolve)
  }
  catch (err){
    reject(err)
  }
})

module.exports = {
  startup,
  shutdown,
  verifyShutdown,
}
