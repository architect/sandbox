let { join } = require('path')
let { existsSync } = require('fs')
let test = require('tape')
let dynalite = require('dynalite')
let { tables } = require(join(process.cwd(), 'src'))
let getDBClient = require(join(process.cwd(), 'src', 'tables', '_get-db-client'))
let TableName = 'mockapp-production-accounts'
let TableName2 = 'mockapp-production-pets'
let mock = join(process.cwd(), 'test', 'mock')
let { port, _refreshInventory, quiet, startupNew: startup, shutdownNew: shutdown } = require('../utils')
let { getPorts } = require(join(process.cwd(), 'src', 'lib', 'ports'))
let ports = getPorts(port)
let str = s => JSON.stringify(s, null, 2)
let dynamo
let externalDBPort = 4567
let dynaliteServer

// Because these tests use Arc Functions `tables`, that module needs a `ARC_TABLES_PORT` env var to run locally
// That said, to prevent side-effects, destroy that env var immediately after use
function setup (t, provided) {
  let { tablesPort } = ports
  process.env.ARC_TABLES_PORT = provided || tablesPort
  if (!process.env.ARC_TABLES_PORT) t.fail('ARC_TABLES_PORT should be set')
}
function teardown (t) {
  ports = getPorts(port)
  delete process.env.ARC_TABLES_PORT
  if (process.env.ARC_TABLES_PORT) t.fail('ARC_TABLES_PORT should not be set')
}

test('Set up env', t => {
  t.plan(1)
  t.ok(tables, 'Tables module is present')
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
  let mode = `[Tables / ${runType}]`

  test(`${mode} Async tables.start`, async t => {
    if (runType === 'module') {
      t.plan(1)
      try {
        let result = await tables.start({ cwd: join(mock, 'normal'), port, quiet, _refreshInventory })
        t.equal(result, 'DynamoDB successfully started', 'Tables started (async)')
      }
      catch (err) {
        t.fail(err)
      }
    }
    else {
      t.plan(1)
      t.pass('Skipped because binary')
    }
  })

  test(`${mode} Start Sandbox`, t => {
    if (runType === 'binary') {
      startup[runType](t, 'normal')
    }
    else {
      t.plan(1)
      t.pass('Skipped because module')
    }
  })

  test(`${mode} Get client`, t => {
    t.plan(1)
    getDBClient(ports, function _gotDBClient (err, client) {
      if (err) console.log(err) // Yes, but actually no
      dynamo = client
      t.ok(dynamo, 'Got Dynamo client')
    })
  })

  test(`${mode} Can list tables`, t => {
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

  test(`${mode} Async tables.end`, async t => {
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
    else {
      t.plan(1)
      t.pass('Skipped because binary')
    }
  })

  test(`${mode} Shut down Sandbox`, t => {
    if (runType === 'binary') {
      shutdown[runType](t)
    }
    else {
      t.plan(1)
      t.pass('Skipped because module')
    }
  })

  test(`${mode} Sync tables.start`, t => {
    if (runType === 'module') {
      t.plan(1)
      tables.start({ cwd: join(mock, 'normal'), port, quiet, _refreshInventory }, function (err, result) {
        if (err) t.fail(err)
        else t.equal(result, 'DynamoDB successfully started', 'Tables started (sync)')
      })
    }
    else {
      t.plan(1)
      t.pass('Skipped because binary')
    }
  })

  test(`${mode} Start Sandbox`, t => {
    if (runType === 'binary') {
      startup[runType](t, 'normal')
    }
    else {
      t.plan(1)
      t.pass('Skipped because module')
    }
  })

  test(`${mode} Get client`, t => {
    t.plan(1)
    getDBClient(ports, function _gotDBClient (err, client) {
      if (err) console.log(err) // Yes, but actually no
      dynamo = client
      t.ok(dynamo, 'Got Dynamo client')
    })
  })

  test(`${mode} Default tables are present`, t => {
    t.plan(2)
    setup(t)
    let defaultTables = [
      'mockapp-production-arc-sessions',
      'mockapp-staging-arc-sessions',
    ]
    dynamo.listTables({}, function done (err, result) {
      if (err) t.fail(err)
      else {
        for (let table of defaultTables) {
          t.ok(result.TableNames.includes(table), `Found table: ${table}`)
        }
        teardown(t)
      }
    })
  })

  test(`${mode} Can insert a row`, t => {
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

  test(`${mode} Can read index in Arc 6`, t => {
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

  test(`${mode} Can read index in Arc 6`, t => {
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

  test(`${mode} Can read the row`, t => {
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

  test(`${mode} Can query the index`, t => {
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

  test(`${mode} Sync tables.end`, t => {
    if (runType === 'module') {
      t.plan(1)
      tables.end(function (err, result) {
        if (err) t.fail(err)
        else t.equal(result, 'DynamoDB successfully shut down', 'Tables ended')
      })
    }
    else {
      t.plan(1)
      t.pass('Skipped because binary')
    }
  })

  test(`${mode} Shut down Sandbox`, t => {
    if (runType === 'binary') {
      shutdown[runType](t)
    }
    else {
      t.plan(1)
      t.pass('Skipped because module')
    }
  })

  /**
   * External database support
   */
  test(`${mode} Start external DB`, t => {
    t.plan(1)
    dynaliteServer = dynalite({ path: join(mock, 'normal', '.db'), createTableMs: 0 })
    dynaliteServer.listen(externalDBPort, err => {
      if (err) t.fail(err)
      else t.pass('External DB successfully started')
    })
  })

  test(`${mode} Async tables.start`, async t => {
    if (runType === 'module') {
      t.plan(1)
      try {
        process.env.ARC_DB_EXTERNAL = true
        setup(t, externalDBPort)
        ports = getPorts() // Reset those ports
        let result = await tables.start({ cwd: join(mock, 'external-db'), quiet })
        t.equal(result, 'DynamoDB successfully started', 'Tables started in external mode')
        teardown(t)
      }
      catch (err) {
        t.fail(err)
      }
    }
    else {
      t.plan(1)
      t.pass('Skipped because binary')
    }
  })

  test(`${mode} Start Sandbox`, t => {
    if (runType === 'binary') {
      process.env.ARC_DB_EXTERNAL = true
      setup(t, externalDBPort)
      ports = getPorts() // Reset those ports
      startup[runType](t, 'external-db')
      teardown(t)
    }
    else {
      t.plan(1)
      t.pass('Skipped because module')
    }
  })

  test(`${mode} Get client`, t => {
    t.plan(1)
    setup(t, externalDBPort)
    getDBClient(ports, function _gotDBClient (err, client) {
      if (err) console.log(err) // Yes, but actually no
      dynamo = client
      t.ok(dynamo, 'Got Dynamo client')
      teardown(t)
    })
  })

  test(`${mode} Can list tables`, t => {
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

  test(`${mode} Async tables.end`, async t => {
    if (runType === 'module') {
      t.plan(1)
      try {
        let ended = await tables.end()
        delete process.env.ARC_DB_EXTERNAL
        t.equal(ended, 'DynamoDB successfully shut down', 'Tables ended')
        teardown(t)
      }
      catch (err) {
        t.fail(err)
      }
    }
    else {
      t.plan(1)
      t.pass('Skipped because binary')
    }
  })

  test(`${mode} Shut down Sandbox`, t => {
    if (runType === 'binary') {
      delete process.env.ARC_DB_EXTERNAL
      shutdown[runType](t)
      teardown(t)
    }
    else {
      t.plan(1)
      t.pass('Skipped because module')
    }
  })

  test(`${mode} Stop external DB`, t => {
    t.plan(1)
    dynaliteServer.close(err => {
      if (err) t.fail(err)
      else t.pass('External DB successfully shut down')
    })
  })

  if (runType === 'module') {
    // `all:true` option for starting and stopping
    test(`${mode} Sync tables.start({ all: true })`, t => {
      t.plan(1)
      ports = getPorts(port) // Reset the port reset (from external DB tests)
      tables.start({ cwd: join(mock, 'normal'), port, _refreshInventory, quiet, all: true }, function (err, result) {
        if (err) t.fail(err)
        else t.equal(result, 'DynamoDB successfully started', 'Tables started (sync)')
      })
    })

    test(`${mode} Sync tables.end({ all: true })`, t => {
      t.plan(1)
      tables.end(function (err, result) {
        if (err) t.fail(err)
        else t.equal(result, 'DynamoDB successfully shut down', 'Tables ended')
      })
    })

    test(`${mode} Async tables.start({ all: true })`, async t => {
      t.plan(1)
      try {
        let result = await tables.start({ cwd: join(mock, 'normal'), port, _refreshInventory, quiet, all: true })
        t.equal(result, 'DynamoDB successfully started', 'Tables started (async)')
      }
      catch (err) {
        t.fail(err)
      }
    })

    test(`${mode} Async tables.end({ all: true })`, async t => {
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
