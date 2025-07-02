let { join } = require('path')
let test = require('tape')
let dynalite = require('dynalite')
let sandbox = require(join(process.cwd(), 'src'))
let getDBClient = require(join(process.cwd(), 'src', 'tables', '_get-db-client'))
let TableName = 'mockapp-production-accounts'
let TableName2 = 'mockapp-production-pets'
let mock = join(process.cwd(), 'test', 'mock')
let { credentials: creds, run, startup, shutdown } = require('../utils')
let str = s => JSON.stringify(s, null, 2)
let dynamo
let tablesPort = 5555
let ports = { tables: tablesPort }
let externalDBPort = 4567
let dynaliteServer
let confirmStarted = 'Seeded 2 tables with 4 rows'
let inventory = {}

// Because these tests use Arc Functions `tables`, that module needs a `ARC_TABLES_PORT` env var to run locally
// That said, to prevent side-effects, destroy that env var immediately after use
function setup (t, provided) {
  process.env.ARC_TABLES_PORT = provided || tablesPort
  if (!process.env.ARC_TABLES_PORT) t.fail('ARC_TABLES_PORT should be set')
}
function teardown (t) {
  delete process.env.ARC_TABLES_PORT
  if (process.env.ARC_TABLES_PORT) t.fail('ARC_TABLES_PORT should not be set')
}

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got Sandbox')
})

test('Run tables tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  let mode = `[Tables / ${runType}]`

  t.test(`${mode} Start Sandbox`, t => {
    startup[runType](t, 'normal')
  })

  t.test(`${mode} Get client`, t => {
    t.plan(1)
    getDBClient({ creds, inventory, ports }, function _gotDBClient (err, client) {
      if (err) console.log(err) // Yes, but actually no
      dynamo = client.DynamoDB
      t.ok(dynamo, 'Got Dynamo client')
    })
  })

  t.test(`${mode} Can list tables`, async t => {
    t.plan(1)
    setup(t)
    let result = await dynamo.ListTables({})
    let { TableNames } = result
    t.ok(Array.isArray(TableNames), `Got tables back from the DB: ${TableNames}`)
    teardown(t)
  })

  t.test(`${mode} Can insert a row`, async t => {
    t.plan(1)
    setup(t)
    let result = await dynamo.PutItem({
      TableName,
      Item: {
        accountID: 'mock-account-id',
        email: 'person@email.lol',
      },
    })
    t.ok(result, `Got result: ${str(result)}`)
    teardown(t)
  })

  t.test(`${mode} Can read index in Arc 6`, async t => {
    t.plan(1)
    setup(t)
    let result = await dynamo.DescribeTable({
      TableName,
    })
    t.equal(result.Table.GlobalSecondaryIndexes[0].IndexName, 'email-index', 'Got index: email-index')
    teardown(t)
  })

  t.test(`${mode} Can read index in Arc 6`, async t => {
    t.plan(3)
    setup(t)
    let result = await dynamo.DescribeTable({
      TableName: TableName2,
    })
    let indexes = result.Table.GlobalSecondaryIndexes
    t.equal(indexes.length, 2, 'Got back two indexes')
    t.equal(indexes[0].IndexName, 'petID-index', 'Got index: petID-index')
    t.equal(indexes[1].IndexName, 'accountID-petID-index', 'Got index: accountID-petID-index')
    teardown(t)
  })

  t.test(`${mode} Can read the row`, async t => {
    t.plan(1)
    setup(t)
    let result = await dynamo.GetItem({
      TableName,
      Key: {
        accountID: 'fake-account-id',
      },
    })
    t.ok(result, `Got result: ${str(result)}`)
    teardown(t)
  })

  t.test(`${mode} Can query the index`, async t => {
    t.plan(1)
    setup(t)
    let result = await dynamo.Query({
      TableName,
      IndexName: 'email-index',
      KeyConditions: {
        email: {
          AttributeValueList: [ { S: 'person@email.lol' } ],
          ComparisonOperator: 'EQ',
        },
      },
    })
    t.ok(result, `Got result: ${str(result)}`)
    teardown(t)
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  /**
   * Seed data using different files
   */
  for (let filetype of [ 'js', 'json', 'mjs', 'cjs', 'custom' ]) {
    let testNameSuffix = `(w/ ${filetype} seed-data)`
    t.test(`${mode} Start Sandbox ${testNameSuffix}`, t => {
      startup[runType](t, join('seed-data', filetype), { confirmStarted })
    })

    t.test(`${mode} Scan seeded rows from first table ${testNameSuffix}`, async t => {
      t.plan(3)
      setup(t)
      let result = await dynamo.Scan({ TableName: 'seed-data-staging-stuff' })
      console.log(str(result))
      t.equal(result.Count, 2, 'Got two results')
      t.equal(result.Items[0].id, 'fiz', `Got expected row`)
      t.equal(result.Items[1].id, 'foo', `Got expected row`)
      teardown(t)
    })

    t.test(`${mode} Scan seeded rows from second table ${testNameSuffix}`, async t => {
      t.plan(3)
      setup(t)
      let result = await dynamo.Scan({ TableName: 'seed-data-staging-things' })
      console.log(str(result))
      t.equal(result.Count, 2, 'Got two results')
      t.equal(result.Items[0].id, 'foo', `Got expected row`)
      t.equal(result.Items[1].id, 'foo', `Got expected row`)
      teardown(t)
    })

    t.test(`${mode} Shut down Sandbox ${testNameSuffix}`, t => {
      shutdown[runType](t)
    })
  }

  t.test(`${mode} Start Sandbox`, t => {
    process.env.ARC_ENV = 'staging'
    process.env.ARC_SANDBOX = '{}' // Force aws-lite to disable keepalive
    startup[runType](t, join('seed-data', 'js'))
  })

  t.test(`${mode} Data is not seeded when in !testing env`, async t => {
    t.plan(1)
    setup(t)
    let result = await dynamo.Scan({ TableName: 'seed-data-staging-stuff' })
    console.log(str(result))
    t.equal(result.Count, 0, 'Got zero results')
    teardown(t)
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    delete process.env.ARC_ENV
    delete process.env.ARC_SANDBOX
    shutdown[runType](t)
  })

  /**
   * External database support
   */
  t.test(`${mode} Start external DB`, t => {
    t.plan(1)
    dynaliteServer = dynalite({ path: join(mock, 'normal', '.db'), createTableMs: 0 })
    dynaliteServer.listen(externalDBPort, err => {
      if (err) t.end(err)
      else t.pass('External DB successfully started')
    })
  })

  t.test(`${mode} Start Sandbox (external DB)`, t => {
    process.env.ARC_DB_EXTERNAL = true
    setup(t, externalDBPort)
    startup[runType](t, 'external-db')
  })

  t.test(`${mode} Get client (external DB)`, t => {
    t.plan(1)
    setup(t, externalDBPort)
    getDBClient({ creds, inventory, ports: { tables: externalDBPort } }, function _gotDBClient (err, client) {
      if (err) console.log(err) // Yes, but actually no
      dynamo = client.DynamoDB
      t.ok(dynamo, 'Got Dynamo client')
      teardown(t)
    })
  })

  t.test(`${mode} Can list tables (external DB)`, async t => {
    t.plan(1)
    setup(t, externalDBPort)
    let result = await dynamo.ListTables({})
    let { TableNames } = result
    t.ok(Array.isArray(TableNames), `Got tables back from the DB: ${TableNames}`)
    teardown(t)
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
    delete process.env.ARC_DB_EXTERNAL
  })

  t.test(`${mode} Stop external DB`, t => {
    t.plan(1)
    dynaliteServer.close(err => {
      if (err) t.end(err)
      else t.pass('External DB successfully shut down')
    })
  })
}
