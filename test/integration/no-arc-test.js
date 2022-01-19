let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let getDBClient = require('../../src/tables/_get-db-client')
let { run, startup, shutdown, url } = require('../utils')
let ports = { tables: 5555 }

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Sandbox is present')
})

test('Run Arc project manifest tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  let mode = `[No manifest present / ${runType}]`

  t.test(`${mode} Start Sandbox without an Architect project manifest`, t => {
    startup[runType](t, 'no-arc')
  })

  t.test('get /', t => {
    t.plan(2)
    tiny.get({ url }, function _got (err, data) {
      if (err) t.fail(err)
      else {
        t.ok(data, 'got /')
        t.ok(data.body.startsWith('Hello from Architect Sandbox running without an Architect file!'), 'is hello world')
      }
    })
  })

  let dynamo
  t.test('Get Dynamo client', t => {
    t.plan(1)
    getDBClient(ports, function _gotDBClient (err, client) {
      if (err) console.log(err) // Yes, but actually no
      dynamo = client
      t.ok(dynamo, 'Got Dynamo client')
    })
  })

  t.test('Can list tables', t => {
    t.plan(1)
    dynamo.listTables({}, function done (err, result) {
      if (err) t.fail(err)
      else t.ok(Array.isArray(result.TableNames), 'got tables')
    })
  })

  t.test('Default tables present', t => {
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

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
