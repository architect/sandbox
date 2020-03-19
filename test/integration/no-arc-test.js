let path = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sandbox = require('../../src')
let getDBClient = require('../../src/db/_get-db-client')
let cwd = process.cwd()

let url = 'http://localhost:6666'

// Verify sandbox shut down
let shutdown = (t, err) => {
  t.equal(err.code, 'ECONNREFUSED', 'Sandbox succssfully shut down')
}

let end
test('Env', t=> {
  t.plan(1)
  t.ok(sandbox, 'got sandbox')
})

/**
 * Test sandbox http in isolation
 */
test('Start Sandbox without an Architect project manifest', t=> {
  t.plan(1)
  // move to test/mock
  process.chdir(path.join(__dirname, '..', 'mock', 'no-arc'))
  sandbox.start({}, function (err, close) {
    if (err) t.fail('Sandbox failed (sync)')
    else {
      end = close
      t.ok(end, 'Sandbox started (sync)')
    }
  })
})

test('get /', t=> {
  t.plan(2)
  tiny.get({url},
  function _got(err, data) {
    if (err) t.fail(err)
    else {
      t.ok(data, 'got /')
      t.ok(data.body.startsWith('Hello from Architect Sandbox running without an Architect file!'), 'is hello world')
      console.log({data})
    }
  })
})

let dynamo
test('Get Dynamo client', t=> {
  t.plan(1)
  getDBClient(function _gotDBClient(err, client) {
    if (err) console.log(err) // Yes, but actually no
    dynamo = client
    t.ok(dynamo, 'Got Dynamo client')
  })
})

test('Can list tables', t=> {
  t.plan(1)
  dynamo.listTables({}, function done(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(Array.isArray(result.TableNames), 'got tables')
      console.log(result)
    }
  })
})

test('default tables present', t => {
  t.plan(5)
  let defaultTables = [
    'app-default-production-arc-sessions',
    'app-default-production-data',
    'app-default-staging-arc-sessions',
    'app-default-staging-data',
    'arc-sessions'
  ]
  dynamo.listTables({}, function done(err, result) {
    if (err) t.fail(err)
    else {
      for (let table of defaultTables) {
        t.ok(result.TableNames.includes(table), `found ${table}`)
      }
    }
  })
})

test('shut down sandbox', t=> {
  t.plan(2)
  end(() => {
    tiny.get({url}, err => {
      if (err) shutdown(t, err)
      else t.fail('Sandbox did not shut down')
    })
  })
  process.chdir(cwd)
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
