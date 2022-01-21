let { join } = require('path')
let test = require('tape')
let dynalite = require('dynalite')
let { tables } = require(join(process.cwd(), 'src'))
let getDBClient = require(join(process.cwd(), 'src', 'tables', '_get-db-client'))
let TableName = 'mockapp-production-accounts'
let TableName2 = 'mockapp-production-pets'
let mock = join(process.cwd(), 'test', 'mock')
let { _refreshInventory, run, quiet, startup, shutdown } = require('../utils')
let str = s => JSON.stringify(s, null, 2)
let dynamo
let tablesPort = 5555
let ports = { tables: tablesPort }
let externalDBPort = 4567
let dynaliteServer

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
  t.ok(tables, 'Tables module is present')
})

test('Run tables tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  let mode = `[Tables / ${runType}]`

  t.test(`${mode} Async tables.start`, async t => {
    if (runType === 'module') {
      t.plan(1)
      try {
        let result = await tables.start({ cwd: join(mock, 'normal'), quiet, _refreshInventory })
        t.equal(result, 'DynamoDB successfully started', 'Tables started (async)')
      }
      catch (err) {
        t.fail(err)
      }
    }
    else await startup[runType].async(t, 'normal')
  })

  t.test(`${mode} Get client`, t => {
    t.plan(1)
    getDBClient(ports, function _gotDBClient (err, client) {
      if (err) console.log(err) // Yes, but actually no
      dynamo = client
      t.ok(dynamo, 'Got Dynamo client')
    })
  })

  t.test(`${mode} Can list tables`, t => {
    t.plan(1)
    setup(t)
    dynamo.listTables({}, function done (err, result) {
      if (err) t.fail(err)
      else {
        let { TableNames } = result
        t.ok(Array.isArray(TableNames), `Got tables back from the DB: ${TableNames}`)
        teardown(t)
      }
    })
  })

  t.test(`${mode} Async tables.end`, async t => {
    if (runType === 'module') {
      t.plan(1)
      try {
        let ended = await tables.end()
        t.equal(ended, 'DynamoDB successfully shut down', 'Tables ended')
      }
      catch (err) {
        t.fail(err)
      }
    }
    else await shutdown[runType].async(t)
  })

  t.test(`${mode} Sync tables.start`, t => {
    if (runType === 'module') {
      t.plan(1)
      tables.start({ cwd: join(mock, 'normal'), quiet, _refreshInventory }, function (err, result) {
        if (err) t.fail(err)
        else t.equal(result, 'DynamoDB successfully started', 'Tables started (sync)')
      })
    }
    else startup[runType](t, 'normal')
  })

  t.test(`${mode} Get client`, t => {
    t.plan(1)
    getDBClient(ports, function _gotDBClient (err, client) {
      if (err) console.log(err) // Yes, but actually no
      dynamo = client
      t.ok(dynamo, 'Got Dynamo client')
    })
  })

  t.test(`${mode} Can insert a row`, t => {
    t.plan(1)
    setup(t)
    dynamo.putItem({
      TableName,
      Item: {
        accountID: { S: 'mock-account-id' },
        email: { S: 'person@email.lol' }
      }
    },
    function _put (err, result) {
      if (err) t.fail(err)
      else {
        t.ok(result, `Got result: ${str(result)}`)
        teardown(t)
      }
    })
  })

  t.test(`${mode} Can read index in Arc 6`, t => {
    t.plan(1)
    setup(t)
    dynamo.describeTable({
      TableName
    },
    function _desc (err, result) {
      if (err) t.fail(err)
      else {
        t.equal(result.Table.GlobalSecondaryIndexes[0].IndexName, 'email-index', 'Got index: email-index')
        teardown(t)
      }
    })
  })

  t.test(`${mode} Can read index in Arc 6`, t => {
    t.plan(3)
    setup(t)
    dynamo.describeTable({
      TableName: TableName2
    },
    function _desc (err, result) {
      if (err) t.fail(err)
      else {
        let indexes = result.Table.GlobalSecondaryIndexes
        t.equal(indexes.length, 2, 'Got back two indexes')
        t.equal(indexes[0].IndexName, 'petID-index', 'Got index: petID-index')
        t.equal(indexes[1].IndexName, 'accountID-petID-index', 'Got index: accountID-petID-index')
        teardown(t)
      }
    })
  })

  t.test(`${mode} Can read the row`, t => {
    t.plan(1)
    setup(t)
    dynamo.getItem({
      TableName,
      Key: {
        accountID: { S: 'fake-account-id' }
      }
    },
    function _desc (err, result) {
      if (err) t.fail(err)
      else {
        t.ok(result, `Got result: ${str(result)}`)
        teardown(t)
      }
    })
  })

  t.test(`${mode} Can query the index`, t => {
    t.plan(1)
    setup(t)
    dynamo.query({
      TableName,
      IndexName: 'email-index',
      KeyConditions: {
        email: {
          AttributeValueList: [ { S: 'person@email.lol' } ],
          ComparisonOperator: 'EQ'
        }
      }
    },
    function _desc (err, result) {
      if (err) t.fail(err)
      else {
        t.ok(result, `Got result: ${str(result)}`)
        teardown(t)
      }
    })
  })

  t.test(`${mode} Sync tables.end`, t => {
    if (runType === 'module') {
      t.plan(1)
      tables.end(function (err, result) {
        if (err) t.fail(err)
        else t.equal(result, 'DynamoDB successfully shut down', 'Tables ended')
      })
    }
    else shutdown[runType](t)
  })

  /**
   * External database support
   */
  t.test(`${mode} Start external DB`, t => {
    t.plan(1)
    dynaliteServer = dynalite({ path: join(mock, 'normal', '.db'), createTableMs: 0 })
    dynaliteServer.listen(externalDBPort, err => {
      if (err) t.fail(err)
      else t.pass('External DB successfully started')
    })
  })

  t.test(`${mode} Async tables.start (external DB)`, async t => {
    process.env.ARC_DB_EXTERNAL = true
    setup(t, externalDBPort)
    if (runType === 'module') {
      t.plan(1)
      try {
        let result = await tables.start({ cwd: join(mock, 'external-db'), quiet })
        t.equal(result, 'DynamoDB successfully started', 'Tables started in external mode')
        teardown(t)
      }
      catch (err) {
        t.fail(err)
      }
    }
    else await startup[runType].async(t, 'external-db')
  })

  t.test(`${mode} Get client (external DB)`, t => {
    t.plan(1)
    setup(t, externalDBPort)
    getDBClient({ tables: externalDBPort }, function _gotDBClient (err, client) {
      if (err) console.log(err) // Yes, but actually no
      dynamo = client
      t.ok(dynamo, 'Got Dynamo client')
      teardown(t)
    })
  })

  t.test(`${mode} Can list tables (external DB)`, t => {
    t.plan(1)
    setup(t, externalDBPort)
    dynamo.listTables({}, function done (err, result) {
      if (err) t.fail(err)
      else {
        let { TableNames } = result
        t.ok(Array.isArray(TableNames), `Got tables back from the DB: ${TableNames}`)
        teardown(t)
      }
    })
  })

  t.test(`${mode} Async tables.end (external DB)`, async t => {
    delete process.env.ARC_DB_EXTERNAL
    if (runType === 'module') {
      t.plan(1)
      try {
        let ended = await tables.end()
        t.equal(ended, 'DynamoDB successfully shut down', 'Tables ended')
        teardown(t)
      }
      catch (err) {
        t.fail(err)
      }
    }
    else await shutdown[runType].async(t)
  })

  t.test(`${mode} Stop external DB`, t => {
    t.plan(1)
    dynaliteServer.close(err => {
      if (err) t.fail(err)
      else t.pass('External DB successfully shut down')
    })
  })

  if (runType === 'module') {
    // `all:true` option for starting and stopping
    t.test(`${mode} Sync tables.start({ all: true })`, t => {
      t.plan(1)
      tables.start({ cwd: join(mock, 'normal'), ports, _refreshInventory, quiet, all: true }, function (err, result) {
        if (err) t.fail(err)
        else t.equal(result, 'DynamoDB successfully started', 'Tables started (sync)')
      })
    })

    t.test(`${mode} Sync tables.end({ all: true })`, t => {
      t.plan(1)
      tables.end(function (err, result) {
        if (err) t.fail(err)
        else t.equal(result, 'DynamoDB successfully shut down', 'Tables ended')
      })
    })

    t.test(`${mode} Async tables.start({ all: true })`, async t => {
      t.plan(1)
      try {
        let result = await tables.start({ cwd: join(mock, 'normal'), ports, _refreshInventory, quiet, all: true })
        t.equal(result, 'DynamoDB successfully started', 'Tables started (async)')
      }
      catch (err) {
        t.fail(err)
      }
    })

    t.test(`${mode} Async tables.end({ all: true })`, async t => {
      t.plan(1)
      try {
        let ended = await tables.end()
        t.equal(ended, 'DynamoDB successfully shut down', 'Tables ended')
      }
      catch (err) {
        t.fail(err)
      }
    })
  }
}
