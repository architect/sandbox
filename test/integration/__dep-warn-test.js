let { join } = require('path')
let { existsSync, mkdirSync, rmSync } = require('fs')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let tiny = require('tiny-json-http')
let { copySync } = require('fs-extra')
let { run, startup, shutdown, url } = require('../utils')

let mock = join(process.cwd(), 'test', 'mock', 'dep-warn')
let tmp = join(mock, 'tmp')
let instructions = str => str.match(/Please run:/g)?.length
let escSlashes = str => str.replace(/\\/g, '\\\\')

let print = true
let data = ''
let stdout = process.stdout.write

function prep (t, copying) {
  try {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 10 })
    if (existsSync(tmp)) {
      t.fail(`${tmp} should not exist`)
      process.exit(1)
    }
    if (copying) {
      mkdirSync(join(tmp, copying), { recursive: true })
      copySync(join(mock, copying), join(tmp, copying))
    }
  }
  catch (err) {
    t.fail('Prep failed')
    console.log(err)
    process.exit(1)
  }
}

function setup () {
  process.stdout.write = write => {
    data += write
  }
}

function teardown () {
  process.stdout.write = stdout
  console.log(`Printed:`)
  console.log(data ? data : '(nothing!)')
}

function reset () {
  data = ''
}

/**
 * Hello! Because this test deals in node module loading it must be run before all other tests.
 */
test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got Sandbox')
})

test('Run dependency warning tests', t => {
  // FIXME: after dozens of attempts to figure out why binary builds on Windows had intermittent failures in GitHub Actions with this particular test suite (specifically 'Deps are in shared'), I've given up. Abandon hope all ye who enter here.
  let { CI: isCI, BINARY_ONLY: isBin } = process.env
  let isWin = process.platform.startsWith('win')
  if (isCI && isBin && isWin) t.end()
  else {
    run(runTests, t)
    t.end()
  }
})

function runTests (runType, t ) {
  let mode = `/ ${runType}`

  t.test(`[Dependency warnings (basic) ${mode}] Start Sandbox`, t => {
    prep(t, 'basic')
    startup[runType](t, join('dep-warn', 'tmp', 'basic'), { print })
  })

  t.test(`[Dependency warnings (basic) ${mode}] Lambda has its own deps`, t => {
    t.plan(5)
    setup()
    tiny.get({
      url: url + '/deps-in-lambda'
    }, function _got (err) {
      teardown()
      if (err) t.fail(err)
      else {
        let dir = escSlashes(join(tmp, 'basic', 'src', 'http', 'get-deps_in_lambda'))
        t.match(data, new RegExp(`Please run: cd ${dir}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
        t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep (`lambda-dep`)')
        t.match(data, /root-dep/, 'Got a dep warning for a root dep (`root-dep`)')
        t.match(data, /@architect\/inventory/, 'Got a dep warning for an out of band dep (`arc/inventory`)')
        t.equal(instructions(data), 1, `Got correct number of dep warnings: 1`)
        reset()
      }
    })
  })

  t.test(`[Dependency warnings (basic) ${mode}] Deps are in root`, t => {
    t.plan(5)
    setup()
    tiny.get({
      url: url + '/deps-in-root'
    }, function _got (err) {
      teardown()
      if (err) t.fail(err)
      else {
        let dir = escSlashes(join(tmp, 'basic', 'src', 'http', 'get-deps_in_root'))
        t.doesNotMatch(data, new RegExp(dir), 'Got a dep warning for root (with instructions to install into root)')
        t.match(data, /Please run: npm i/, 'Got instructions to install into root')
        t.doesNotMatch(data, /root-dep/, 'Did not get dep warning for a root dep (`root-dep`)')
        t.match(data, /@architect\/inventory/, 'Got a dep warning for an out of band dep (`arc/inventory`)')
        t.equal(instructions(data), 1, `Got correct number of dep warnings: 1`)
        reset()
      }
    })
  })

  t.test(`[Dependency warnings (basic) ${mode}] Deps are in shared`, t => {
    t.plan(5)
    setup()
    tiny.get({
      url: url + '/deps-in-shared'
    }, function _got (err) {
      teardown()
      if (err) t.fail(err)
      else {
        let dir = escSlashes(join(tmp, 'basic', 'src', 'http', 'get-deps_in_shared'))
        t.doesNotMatch(data, new RegExp(dir), 'Got a dep warning for shared (with instructions to install into root)')
        t.match(data, /Please run: npm i/, 'Got instructions to install into root')
        t.doesNotMatch(data, /root-dep/, 'Did not get dep warning for a root dep (`root-dep`)')
        t.match(data, /@architect\/inventory/, 'Got a dep warning for an out of band dep (`arc/inventory`)')
        t.equal(instructions(data), 1, `Got correct number of dep warnings: 1`)
        reset()
      }
    })
  })

  t.test(`[Dependency warnings (basic) ${mode}] All deps were found, no warnings`, t => {
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

  t.test(`[Dependency warnings (basic) ${mode}] Deps missing`, t => {
    t.plan(2)
    tiny.get({
      url: url + '/deps-missing'
    }, function _got (err) {
      if (err) {
        t.ok(err, 'Got a failure')
        t.match(err.body, /Cannot find module 'foo'/, 'Could not find dependency (`foo`)')
      }
      else t.fail('Expected an error')
    })
  })

  t.test(`[Dependency warnings (basic) ${mode}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  t.test(`[Dependency warnings (shared - no packages) ${mode}] Start Sandbox`, t => {
    prep(t, 'no-packages')
    startup[runType](t, join('dep-warn', 'tmp', 'no-packages'), { print })
  })

  t.test(`[Dependency warnings (shared - no packages) ${mode}] Shared deps`, t => {
    t.plan(1)
    setup()
    tiny.get({
      url: url + '/shared'
    }, function _got (err) {
      teardown()
      if (err) t.fail(err)
      else {
        t.doesNotMatch(data, /root-dep/, 'Did not get any dep warnings')
        reset()
      }
    })
  })

  t.test(`[Dependency warnings (shared - no packages) ${mode}] Views deps`, t => {
    t.plan(1)
    setup()
    tiny.get({
      url: url + '/views'
    }, function _got (err) {
      teardown()
      if (err) t.fail(err)
      else {
        t.doesNotMatch(data, /root-dep/, 'Did not get any dep warnings')
        reset()
      }
    })
  })

  t.test(`[Dependency warnings (shared - no packages) ${mode}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  t.test(`[Dependency warnings (shared - packages in shared) ${mode}] Start Sandbox`, t => {
    prep(t, 'shared-packages')
    startup[runType](t, join('dep-warn', 'tmp', 'shared-packages'), { print })
  })

  t.test(`[Dependency warnings (shared - packages in shared) ${mode}] Missing shared deps loaded from root`, t => {
    t.plan(5)
    setup()
    tiny.get({
      url: url + '/shared'
    }, function _got (err) {
      teardown()
      if (err) t.fail(err)
      else {
        let dir = escSlashes(join(tmp, 'shared-packages', 'src', 'shared'))
        t.match(data, new RegExp(`Please run: cd ${dir}`), 'Got a dep warning on the correct Lambda (with instructions to install deps into src/shared)')
        t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep (`lambda-dep`)')
        t.match(data, /root-dep/, 'Got a dep warning for a root dep (`root-dep`)')
        t.match(data, /@architect\/inventory/, 'Got a dep warning for an out of band dep (`arc/inventory`)')
        t.equal(instructions(data), 2, `Got correct number of dep warnings: 2`)
        reset()
      }
    })
  })

  t.test(`[Dependency warnings (shared - packages in shared) ${mode}] Missing views deps loaded from root`, t => {
    t.plan(5)
    setup()
    tiny.get({
      url: url + '/views'
    }, function _got (err) {
      teardown()
      if (err) t.fail(err)
      else {
        let dir = escSlashes(join(tmp, 'shared-packages', 'src', 'views'))
        t.match(data, new RegExp(`Please run: cd ${dir}`), 'Got a dep warning on the correct Lambda (with instructions to install deps into src/views)')
        t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep (`lambda-dep`)')
        t.match(data, /root-dep/, 'Got a dep warning for a root dep (`root-dep`)')
        t.match(data, /@architect\/inventory/, 'Got a dep warning for an out of band dep (`arc/inventory`)')
        t.equal(instructions(data), 2, `Got correct number of dep warnings: 2`)
        reset()
      }
    })
  })

  t.test(`[Dependency warnings (shared - packages in shared) ${mode}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  t.test(`[Dependency warnings (shared - packages in Lambdas) ${mode}] Start Sandbox`, t => {
    prep(t, 'lambda-packages')
    startup[runType](t, join('dep-warn', 'tmp', 'lambda-packages'), { print })
  })

  t.test(`[Dependency warnings (shared - packages in Lambdas) ${mode}] Missing shared deps loaded from root`, t => {
    t.plan(5)
    setup()
    tiny.get({
      url: url + '/shared'
    }, function _got (err) {
      teardown()
      if (err) t.fail(err)
      else {
        let dir = escSlashes(join(tmp, 'lambda-packages', 'src', 'http', 'get-shared'))
        t.match(data, new RegExp(`Please run: cd ${dir}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
        t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep (`lambda-dep`)')
        t.match(data, /root-dep/, 'Got a dep warning for a root dep (`root-dep`)')
        t.match(data, /@architect\/inventory/, 'Got a dep warning for an out of band dep (`arc/inventory`)')
        t.equal(instructions(data), 1, `Got correct number of dep warnings: 1`)
        reset()
      }
    })
  })

  t.test(`[Dependency warnings (shared - packages in Lambdas) ${mode}] Missing views deps loaded from root`, t => {
    t.plan(5)
    setup()
    tiny.get({
      url: url + '/views'
    }, function _got (err) {
      teardown()
      if (err) t.fail(err)
      else {
        let dir = escSlashes(join(tmp, 'lambda-packages', 'src', 'http', 'get-views'))
        t.match(data, new RegExp(`Please run: cd ${dir}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
        t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep (`lambda-dep`)')
        t.match(data, /root-dep/, 'Got a dep warning for a root dep (`root-dep`)')
        t.match(data, /@architect\/inventory/, 'Got a dep warning for an out of band dep (`arc/inventory`)')
        t.equal(instructions(data), 1, `Got correct number of dep warnings: 1`)
        reset()
      }
    })
  })

  t.test(`[Dependency warnings (shared - packages in Lambdas) ${mode}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  t.test(`[Dependency warnings (shared - packages in shared + Lambdas) ${mode}] Start Sandbox`, t => {
    prep(t, 'all-packages')
    startup[runType](t, join('dep-warn', 'tmp', 'all-packages'), { print })
  })

  t.test(`[Dependency warnings (shared - packages in shared + Lambdas) ${mode}] Missing shared deps loaded from root`, t => {
    t.plan(6)
    setup()
    tiny.get({
      url: url + '/shared'
    }, function _got (err) {
      teardown()
      if (err) t.fail(err)
      else {
        let lambdaDir = escSlashes(join(tmp, 'all-packages', 'src', 'http', 'get-shared'))
        let sharedDir = escSlashes(join(tmp, 'all-packages', 'src', 'shared'))
        t.match(data, new RegExp(`Please run: cd ${lambdaDir}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
        t.match(data, new RegExp(`Please run: cd ${sharedDir}`), 'Got a dep warning on the correct Lambda (with instructions to install deps into src/shared)')
        t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep (`lambda-dep`)')
        t.match(data, /another-root-dep/, 'Got a dep warning for a root dep (`root-dep`)')
        t.match(data, /@architect\/inventory/, 'Got a dep warning for an out of band dep (`arc/inventory`)')
        t.equal(instructions(data), 2, `Got correct number of dep warnings: 2`)
        reset()
      }
    })
  })

  t.test(`[Dependency warnings (shared - packages in shared + Lambdas) ${mode}] Missing views deps loaded from root`, t => {
    t.plan(6)
    setup()
    tiny.get({
      url: url + '/views'
    }, function _got (err) {
      teardown()
      if (err) t.fail(err)
      else {
        let lambdaDir = escSlashes(join(tmp, 'all-packages', 'src', 'http', 'get-views'))
        let viewsDir = escSlashes(join(tmp, 'all-packages', 'src', 'views'))
        t.match(data, new RegExp(`Please run: cd ${lambdaDir}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
        t.match(data, new RegExp(`Please run: cd ${viewsDir}`), 'Got a dep warning on the correct Lambda (with instructions to install deps into src/views)')
        t.doesNotMatch(data, /lambda-dep/, 'Did not get dep warning for a Lambda dep (`lambda-dep`)')
        t.match(data, /another-root-dep/, 'Got a dep warning for a root dep (`root-dep`)')
        t.match(data, /@architect\/inventory/, 'Got a dep warning for an out of band dep (`arc/inventory`)')
        t.equal(instructions(data), 2, `Got correct number of dep warnings: 2`)
        reset()
      }
    })
  })

  t.test(`[Dependency warnings (shared - packages in shared + Lambdas) ${mode}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  t.test(`[Dependency warnings ${mode}] Teardown`, t => {
    t.plan(1)
    prep(t)
    t.pass('Done')
  })
}
