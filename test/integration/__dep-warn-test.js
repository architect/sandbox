let test = require('tape')
let { join } = require('path')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let tiny = require('tiny-json-http')
let { port, shutdown, url } = require('../utils')

let mock = join(process.cwd(), 'test', 'mock', 'dep-warn')
let instructions = str => str.match(/Please run:/g).length

let data = ''
let stdout = process.stdout.write

function setup () {
  process.stdout.write = write => {
    data += write
  }
}

function teardown () {
  process.stdout.write = stdout
}

function reset () {
  data = ''
}

/**
 * Hello! Because this test deals in node module loading it must be run before all other tests.
 */
test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'got sandbox')
})

test('[Dependency warnings (basic)] Start Sandbox', t => {
  t.plan(1)
  sandbox.start({ cwd: join(mock, 'basic'), port }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Sandbox successfully started', 'Sandbox started')
  })
})

test('[Dependency warnings (basic)] Lambda has its own deps', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/deps-in-lambda'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.match(data, new RegExp(`Please run: cd ${join(mock, 'basic', 'src', 'http', 'get-deps_in_lambda').replace(/\\/g, '\\\\')}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
      t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep')
      t.match(data, /root-dep/, 'Got a dep warning for a root dep')
      t.match(data, new RegExp('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 1, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (basic)] Deps are in root', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/deps-in-root'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.doesNotMatch(data, new RegExp(join(mock, 'basic', 'src', 'http', 'get-deps_in_root').replace(/\\/g, '\\\\')), 'Got a dep warning for the root (with instructions to install into the root)')
      t.match(data, /Please run: npm i/, 'Got instructions to install into the root')
      t.doesNotMatch(data, /root-dep/, 'Got a dep warning for a root dep')
      t.match(data, new RegExp('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 1, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (basic)] Deps are in shared', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/deps-in-shared'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.doesNotMatch(data, new RegExp(join(mock, 'basic', 'src', 'http', 'get-deps_in_shared').replace(/\\/g, '\\\\')), 'Got a dep warning for the shared (with instructions to install into the shared)')
      t.match(data, /Please run: npm i/, 'Got instructions to install into the shared')
      t.doesNotMatch(data, /root-dep/, 'Got a dep warning for a root dep')
      t.match(data, new RegExp('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 1, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (basic)] Deps found', t => {
  t.plan(1)
  setup()
  tiny.get({
    url: url + '/deps-found'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.equal(data, '', 'No warnings issued when all deps are found uniformly')
      reset()
    }
  })
})

test('[Dependency warnings (basic)] Deps missing', t => {
  t.plan(1)
  tiny.get({
    url: url + '/deps-missing'
  }, function _got (err) {
    if (err) t.ok(err, 'Got a failure')
    else t.fail('Expected an error')
  })
})

test('[Dependency warnings (basic)] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('[Dependency warnings (shared - no packages)] Start Sandbox', t => {
  t.plan(1)
  sandbox.start({ cwd: join(mock, 'no-packages'), port }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Sandbox successfully started', 'Sandbox started')
  })
})

test('[Dependency warnings (shared - no packages)] Shared deps', t => {
  t.plan(1)
  setup()
  tiny.get({
    url: url + '/shared'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.doesNotMatch(data, /root-dep/, 'Did not get a dep warning')
      reset()
    }
  })
})

test('[Dependency warnings (shared - no packages)] Views deps', t => {
  t.plan(1)
  setup()
  tiny.get({
    url: url + '/views'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.doesNotMatch(data, /root-dep/, 'Did not get a dep warning')
      reset()
    }
  })
})

test('[Dependency warnings (shared - no packages)] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('[Dependency warnings (shared - packages in shared)] Start Sandbox', t => {
  t.plan(1)
  sandbox.start({ cwd: join(mock, 'shared-packages'), port }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Sandbox successfully started', 'Sandbox started')
  })
})

test('[Dependency warnings (shared - packages in shared)] Missing shared deps loaded from root', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/shared'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.match(data, new RegExp(`Please run: cd ${join(mock, 'shared-packages', 'src', 'shared').replace(/\\/g, '\\\\')}`), 'Got a dep warning on the correct Lambda (with instructions to install deps into src/shared)')
      t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep')
      t.match(data, /root-dep/, 'Got a dep warning for a root dep')
      t.match(data, new RegExp('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 2, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (shared - packages in shared)] Missing views deps loaded from root', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/views'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.match(data, new RegExp(`Please run: cd ${join(mock, 'shared-packages', 'src', 'views').replace(/\\/g, '\\\\')}`), 'Got a dep warning on the correct Lambda (with instructions to install deps into src/views)')
      t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep')
      t.match(data, /root-dep/, 'Got a dep warning for a root dep')
      t.match(data, new RegExp('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 2, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (shared - packages in shared)] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('[Dependency warnings (shared - packages in Lambdas)] Start Sandbox', t => {
  t.plan(1)
  sandbox.start({ cwd: join(mock, 'lambda-packages'), port }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Sandbox successfully started', 'Sandbox started')
  })
})

test('[Dependency warnings (shared - packages in Lambdas)] Missing shared deps loaded from root', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/shared'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.match(data, new RegExp(`Please run: cd ${join(mock, 'lambda-packages', 'src', 'http', 'get-shared').replace(/\\/g, '\\\\')}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
      t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep')
      t.match(data, /root-dep/, 'Got a dep warning for a root dep')
      t.match(data, new RegExp('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 1, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (shared - packages in Lambdas)] Missing views deps loaded from root', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/views'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.match(data, new RegExp(`Please run: cd ${join(mock, 'lambda-packages', 'src', 'http', 'get-views').replace(/\\/g, '\\\\')}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
      t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep')
      t.match(data, /root-dep/, 'Got a dep warning for a root dep')
      t.match(data, new RegExp('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 1, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (shared - packages in Lambdas)] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('[Dependency warnings (shared - packages in shared + Lambdas)] Start Sandbox', t => {
  t.plan(1)
  sandbox.start({ cwd: join(mock, 'all-packages'), port }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Sandbox successfully started', 'Sandbox started')
  })
})

test('[Dependency warnings (shared - packages in shared + Lambdas)] Missing shared deps loaded from root', t => {
  t.plan(6)
  setup()
  tiny.get({
    url: url + '/shared'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.match(data, new RegExp(`Please run: cd ${join(mock, 'all-packages', 'src', 'http', 'get-shared').replace(/\\/g, '\\\\')}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
      t.match(data, new RegExp(`Please run: cd ${join(mock, 'all-packages', 'src', 'shared').replace(/\\/g, '\\\\')}`), 'Got a dep warning on the correct Lambda (with instructions to install deps into src/shared)')
      t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep')
      t.match(data, /another-root-dep/, 'Got a dep warning for a root dep')
      t.match(data, new RegExp('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 2, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (shared - packages in shared + Lambdas)] Missing views deps loaded from root', t => {
  t.plan(6)
  setup()
  tiny.get({
    url: url + '/views'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.match(data, new RegExp(`Please run: cd ${join(mock, 'all-packages', 'src', 'http', 'get-views').replace(/\\/g, '\\\\')}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
      t.match(data, new RegExp(`Please run: cd ${join(mock, 'all-packages', 'src', 'views').replace(/\\/g, '\\\\')}`), 'Got a dep warning on the correct Lambda (with instructions to install deps into src/views)')
      t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep')
      t.match(data, /another-root-dep/, 'Got a dep warning for a root dep')
      t.match(data, new RegExp('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 2, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings] Teardown', t => {
  t.plan(1)
  shutdown(t)
})
