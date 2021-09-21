let { join } = require('path')
let { existsSync } = require('fs')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let getDBClient = require('../../src/tables/_get-db-client')
let { port, startup, shutdown, url } = require('../utils')
let { getPorts } = require(join(process.cwd(), 'src', 'lib', 'ports'))
let ports = getPorts(port)

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Sandbox is present')
})

test('Module', t => {
  runTests('module')
  t.end()
})

test('Binary', t => {
  let bin = join(process.cwd(), 'bin', 'sandbox-binary')
  if (existsSync(bin)) {
    runTests('binary')
    t.end()
  }
  else t.end()
})

function runTests (runType) {
  let mode = `[No manifest present / ${runType}]`

  test(`${mode} Start Sandboxwithout an Architect project manifest`, t => {
    startup[runType](t, 'no-arc')
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

  test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
