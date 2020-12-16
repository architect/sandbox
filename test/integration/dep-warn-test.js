let test = require('tape')
let { join } = require('path')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let tiny = require('tiny-json-http')
let { url, shutdown } = require('./http/_utils')

let cwd = process.cwd()
let mock = join(__dirname, '..', 'mock')

let stdout = process.stdout.write
let data = ''

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

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'got sandbox')
})

test('[Dependency warnings] Start Sandbox', t => {
  t.plan(4)
  process.chdir(join(mock, 'dep-warn'))
  sandbox.start({}, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[Dependency warnings] Lambda has its own deps', t => {
  t.plan(4)
  setup()
  tiny.get({
    url: url + '/deps-in-lambda'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.ok(data.includes(`Please run: cd ${process.cwd()}/src/http/get-deps_in_lambda`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
      t.ok(!data.includes('lambda-dep'), 'Did not get dep warning for a Lambda dep')
      t.ok(data.includes('root-dep'), 'Got a dep warning for a root dep')
      t.ok(data.includes('@architect/inventory'), 'Got a dep warning for an out of band dep')
      reset()
    }
  })
})

test('[Dependency warnings] Deps are in root', t => {
  t.plan(4)
  setup()
  tiny.get({
    url: url + '/deps-in-root'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.ok(!data.includes(`${process.cwd()}/src/http/get-deps_in_root`), 'Got a dep warning for the root (with instructions to install into the root)')
      t.ok(data.includes('Please run: npm i'), 'Got instructions to install into the root')
      t.ok(!data.includes('root-dep'), 'Got a dep warning for a root dep')
      t.ok(data.includes('@architect/inventory'), 'Got a dep warning for an out of band dep')
      reset()
    }
  })
})

test('[Dependency warnings] Deps found', t => {
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

test('[Dependency warnings] Deps missing', t => {
  t.plan(1)
  tiny.get({
    url: url + '/deps-missing'
  }, function _got (err) {
    if (err) t.ok(err, 'Got a failure')
    else t.fail('Expected an error')
  })
})

test('[Dependency warnings] Teardown', t => {
  t.plan(3)
  shutdown(t)
  delete process.env.ARC_API_TYPE
  process.chdir(cwd)
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
