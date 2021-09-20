let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let getDBClient = require('../../src/tables/_get-db-client')
let mock = join(process.cwd(), 'test', 'mock')
let { port, quiet, url } = require('../utils')
let { getPorts } = require(join(process.cwd(), 'src', 'lib', 'ports'))
let ports = getPorts(port)

// Verify sandbox shut down
let shutdown = (t, err) => {
  t.equal(err.code, 'ECONNREFUSED', 'Sandbox succssfully shut down')
}

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Sandbox is present')
})

/**
 * Test sandbox http in isolation
 */
test('Start Sandbox without an Architect project manifest', t => {
  t.plan(1)
  sandbox.start({ cwd: join(mock, 'no-arc'), port, quiet }, function (err) {
    if (err) t.fail('Sandbox failed (sync)')
    else t.pass('Sandbox started (sync)')
  })
})

test('get /', t => {
  t.plan(2)
  tiny.get({ url },
    function _got (err, data) {
      if (err) t.fail(err)
      else {
        t.ok(data, 'got /')
        t.ok(data.body.startsWith('Hello from Architect Sandbox running without an Architect file!'), 'is hello world')
      }
    })
})

let dynamo
test('Get Dynamo client', t => {
  t.plan(1)
  getDBClient(ports, function _gotDBClient (err, client) {
    if (err) console.log(err) // Yes, but actually no
    dynamo = client
    t.ok(dynamo, 'Got Dynamo client')
  })
})

test('Can list tables', t => {
  t.plan(1)
  dynamo.listTables({}, function done (err, result) {
    if (err) t.fail(err)
    else t.ok(Array.isArray(result.TableNames), 'got tables')
  })
})

test('Default tables present', t => {
  t.plan(4)
  let defaultTables = [
    'app-default-production-arc-sessions',
    'app-default-production-data',
    'app-default-staging-arc-sessions',
    'app-default-staging-data',
  ]
  dynamo.listTables({}, function done (err, result) {
    if (err) t.fail(err)
    else {
      for (let table of defaultTables) {
        t.ok(result.TableNames.includes(table), `found ${table}`)
      }
    }
  })
})

test('Shut down sandbox', t => {
  t.plan(1)
  sandbox.end(() => {
    tiny.get({ url }, err => {
      if (err) shutdown(t, err)
      else t.fail('Sandbox did not shut down')
    })
  })
})
