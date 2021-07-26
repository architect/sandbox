let { join } = require('path')
let test = require('tape')
let dynalite = require('dynalite')
let { tables } = require(join(process.cwd(), 'src'))
let getDBClient = require(join(process.cwd(), 'src', 'tables', '_get-db-client'))
let TableName = 'mockapp-production-accounts'
let TableName2 = 'mockapp-production-pets'
let mock = join(process.cwd(), 'test', 'mock')
let str = s => JSON.stringify(s, null, 2)
let dynamo
let dbPort = 4567
let dynaliteServer

test('Set up env', t => {
  t.plan(1)
  t.ok(tables, 'Tables module is present')
})

test('Async tables.start', async t => {
  t.plan(1)
  try {
    let result = await tables.start({ cwd: join(mock, 'normal'), quiet: true })
    t.equal(result, 'DynamoDB successfully started', 'Tables started (async)')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Get client', t => {
  t.plan(1)
  getDBClient(function _gotDBClient (err, client) {
    if (err) console.log(err) // Yes, but actually no
    dynamo = client
    t.ok(dynamo, 'Got Dynamo client')
  })
})

test('Can list tables', t => {
  t.plan(1)
  dynamo.listTables({}, function done (err, result) {
    if (err) t.fail(err)
    else {
      let { TableNames } = result
      t.ok(Array.isArray(TableNames), `Got tables back from the DB: ${TableNames}`)
    }
  })
})

test('Async tables.end', async t => {
  t.plan(1)
  try {
    let ended = await tables.end()
    t.equal(ended, 'DynamoDB successfully shut down', 'Tables ended')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Sync tables.start', t => {
  t.plan(1)
  tables.start({ cwd: join(mock, 'normal'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'DynamoDB successfully started', 'Tables started (sync)')
  })
})

test('Get client', t => {
  t.plan(1)
  getDBClient(function _gotDBClient (err, client) {
    if (err) console.log(err) // Yes, but actually no
    dynamo = client
    t.ok(dynamo, 'Got Dynamo client')
  })
})

test('Default tables are present', t => {
  t.plan(2)
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
    }
  })
})

test('Can insert a row', t => {
  t.plan(1)
  dynamo.putItem({
    TableName,
    Item: {
      accountID: { S: 'mock-account-id' },
      email: { S: 'person@email.lol' }
    }
  },
  function _put (err, result) {
    if (err) t.fail(err)
    else t.ok(result, `Got result: ${str(result)}`)
  })
})

test('Can read index in Arc 6', t => {
  t.plan(1)
  dynamo.describeTable({
    TableName
  },
  function _desc (err, result) {
    if (err) t.fail(err)
    else t.equal(result.Table.GlobalSecondaryIndexes[0].IndexName, 'email-index', 'Got index: email-index')
  })
})

test('Can read index in Arc 6', t => {
  t.plan(3)
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
    }
  })
})

test('Can read the row', t => {
  t.plan(1)
  dynamo.getItem({
    TableName,
    Key: {
      accountID: { S: 'fake-account-id' }
    }
  },
  function _desc (err, result) {
    if (err) t.fail(err)
    else t.ok(result, `Got result: ${str(result)}`)
  })
})

test('Can query the index', t => {
  t.plan(1)
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
    else t.ok(result, `Got result: ${str(result)}`)
  })
})

test('Sync tables.end', t => {
  t.plan(1)
  tables.end(function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'DynamoDB successfully shut down', 'Tables ended')
  })
})

/**
 * External database support
 */
test('Start external DB', t => {
  t.plan(1)
  process.env.ARC_DB_EXTERNAL = true
  process.env.ARC_TABLES_PORT = dbPort
  dynaliteServer = dynalite({ path: join(mock, 'normal', '.db'), createTableMs: 0 })
  dynaliteServer.listen(dbPort, err => {
    if (err) t.fail(err)
    else t.pass('External DB successfully started')
  })
})

test('Async tables.start', async t => {
  t.plan(1)
  try {
    let result = await tables.start({ cwd: join(mock, 'external-db') })
    t.equal(result, 'DynamoDB successfully started', 'Tables started in external mode')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Get client', t => {
  t.plan(1)
  getDBClient(function _gotDBClient (err, client) {
    if (err) console.log(err) // Yes, but actually no
    dynamo = client
    t.ok(dynamo, 'Got Dynamo client')
  })
})

test('Can list tables', t => {
  t.plan(1)
  dynamo.listTables({}, function done (err, result) {
    if (err) t.fail(err)
    else {
      let { TableNames } = result
      t.ok(Array.isArray(TableNames), `Got tables back from the DB: ${TableNames}`)
    }
  })
})

test('Async tables.end', async t => {
  t.plan(1)
  try {
    let ended = await tables.end()
    delete process.env.ARC_DB_EXTERNAL
    delete process.env.ARC_TABLES_PORT
    t.equal(ended, 'DynamoDB successfully shut down', 'Tables ended')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Stop external DB', t => {
  t.plan(1)
  dynaliteServer.close(err => {
    if (err) t.fail(err)
    else t.pass('External DB successfully shut down')
  })
})

// `all:true` option for starting and stopping
test('Sync tables.start({ all: true })', t => {
  t.plan(1)
  tables.start({ cwd: join(mock, 'normal'), quiet: true, all: true }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'DynamoDB successfully started', 'Tables started (sync)')
  })
})

test('Sync tables.end({ all: true })', t => {
  t.plan(1)
  tables.end(function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'DynamoDB successfully shut down', 'Tables ended')
  })
})

test('Async tables.start({ all: true })', async t => {
  t.plan(1)
  try {
    let result = await tables.start({ cwd: join(mock, 'normal'), quiet: true, all: true })
    t.equal(result, 'DynamoDB successfully started', 'Tables started (async)')
  }
  catch (err) {
    t.fail(err)
  }
})

test('Async tables.end({ all: true })', async t => {
  t.plan(1)
  try {
    let ended = await tables.end()
    t.equal(ended, 'DynamoDB successfully shut down', 'Tables ended')
  }
  catch (err) {
    t.fail(err)
  }
})
