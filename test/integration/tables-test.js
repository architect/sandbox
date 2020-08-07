let path = require('path')
let test = require('tape')
let { tables } = require('../../src')
let getDBClient = require('../../src/tables/_get-db-client')
let dynamo
let TableName = 'mockapp-production-accounts'
let TableName2 = 'mockapp-production-pets'
let cwd = process.cwd()

/* Regular test suite */
test('tables.start', t => {
  t.plan(3)
  t.ok(tables, 'got tables')
  // move the current process into the mock dir
  process.chdir(path.join(__dirname, '..', 'mock', 'normal'))
  tables.start({}, function () {
    t.pass('@tables created in local database')
  })
  getDBClient(function _gotDBClient (err, client) {
    if (err) console.log(err) // Yes, but actually no
    dynamo = client
    t.ok(dynamo, 'Got Dynamo client')
  })
})

test('can list tables', t => {
  t.plan(1)
  dynamo.listTables({}, function done (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(Array.isArray(result.TableNames), 'got tables')
      console.log(result)
    }
  })
})

test('default tables present', t => {
  t.plan(3)
  let defaultTables = [
    'arc-sessions',
    'mockapp-production-arc-sessions',
    'mockapp-staging-arc-sessions',
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

test('can insert a row', t => {
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
    else {
      t.ok(result, 'got result')
      console.log(result)
    }
  })
})

test('can read index in arc 6', t => {
  t.plan(1)
  dynamo.describeTable({
    TableName
  },
  function _desc (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result.Table.GlobalSecondaryIndexes[0].IndexName === 'email-index', 'email-index')
    }
  })
})

test('can read index in arc 6', t => {
  t.plan(3)
  dynamo.describeTable({
    TableName: TableName2
  },
  function _desc (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result.Table.GlobalSecondaryIndexes.length === 2, 'two')
      t.ok(result.Table.GlobalSecondaryIndexes[0].IndexName === 'petID-index', 'petID-index')
      t.ok(result.Table.GlobalSecondaryIndexes[1].IndexName === 'accountID-petID-index', 'accountID-petID-index')
    }
  })
})

test('can read the row', t => {
  t.plan(1)
  dynamo.getItem({
    TableName,
    Key: {
      accountID: { S: 'fake-account-id' }
    }
  },
  function _desc (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got result')
      console.log(result)
    }
  })
})

test('can query the index', t => {
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
    else {
      t.ok(result, 'got result')
      console.log(result)
    }
  })
})

test('tables.end', t => {
  t.plan(1)
  tables.end(() => {
    t.pass('db ended')
  })
})

/* DEPRECATED mode */
test('tables.start', t => {
  t.plan(3)
  t.ok(tables, 'got tables')
  // move the current process into the mock dir
  process.chdir(path.join(__dirname, '..', 'mock', 'normal'))
  process.env.DEPRECATED = true
  tables.start({}, function () {
    t.pass('@tables created in local database')
    console.log(process.env.DEPRECATED)
  })
  getDBClient(function _gotDBClient (err, client) {
    if (err) console.log(err) // Yes, but actually no
    dynamo = client
    t.ok(dynamo, 'Got Dynamo client')
  })
})

test('can list tables', t => {
  t.plan(1)
  dynamo.listTables({}, function done (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(Array.isArray(result.TableNames), 'got tables')
      console.log(result)
    }
  })
})

test('default tables present', t => {
  t.plan(3)
  let defaultTables = [
    'arc-sessions',
    'mockapp-production-arc-sessions',
    'mockapp-staging-arc-sessions',
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

test('can insert a row', t => {
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
    else {
      t.ok(result, 'got result')
      console.log(result)
    }
  })
})

test('can read index in arc 5', t => {
  t.plan(1)
  dynamo.describeTable({
    TableName
  },
  function _desc (err, result) {
    if (err) t.fail(err)
    else {
      console.log(result.Table.GlobalSecondaryIndexes)
      t.ok(result.Table.GlobalSecondaryIndexes[0].IndexName === 'mockapp-production-accounts-email-index', 'email-index')
    }
  })
})

test('can read index in arc 5', t => {
  t.plan(3)
  dynamo.describeTable({
    TableName: TableName2
  },
  function _desc (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result.Table.GlobalSecondaryIndexes.length === 2, 'two')
      t.ok(result.Table.GlobalSecondaryIndexes[0].IndexName === 'mockapp-production-pets-petID-index', 'petID-index')
      t.ok(result.Table.GlobalSecondaryIndexes[1].IndexName === 'mockapp-production-pets-accountID-petID-index', 'accountID-petID-index')
    }
  })
})

test('can read the row', t => {
  t.plan(1)
  dynamo.getItem({
    TableName,
    Key: {
      accountID: { S: 'fake-account-id' }
    }
  },
  function _desc (err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got result')
      console.log(result)
    }
  })
})

test('can query the index', t => {
  t.plan(1)
  dynamo.query({
    TableName,
    IndexName: 'mockapp-production-accounts-email-index',
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
      t.ok(result, 'got result')
      console.log(result)
    }
  })
})

test('tables.end', t => {
  t.plan(2)
  delete process.env.DEPRECATED
  tables.end(() => {
    t.ok(true, 'db ended')
    process.chdir(cwd)
    t.equal(process.cwd(), cwd, 'Switched back to original working dir')
  })
})
