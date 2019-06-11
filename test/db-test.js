let path = require('path')
let aws = require('aws-sdk')
let test = require('tape')
let {db} = require('../src')
let client = require('../src/db/_get-db-client')
let server

test('db.start', t=> {
  t.plan(2)
  t.ok(db, 'got db')
  // move the current process into the mock dir
  process.chdir(path.join(__dirname, 'mock'))
  server = db.start(function() {
    t.ok(true, '@tables created in local database')
  })
})

test('can list tables', t=> {
  t.plan(1)
  client.listTables({}, function done(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(Array.isArray(result.TableNames), 'got tables')
      console.log(result)
    }
  })
})

let TableName = 'mockapp-production-accounts'

test('can insert a row', t=> {
  t.plan(1)
  client.putItem({
    TableName,
    Item: {
      accountID: {S: 'mock-account-id'},
      email: {S: 'person@email.lol'}
    }
  },
  function _put(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got result')
      console.log(result)
    }
  })
})

test('can read index', t=> {
  t.plan(1)
  client.describeTable({
    TableName
  },
  function _desc(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got result')
      console.log(result)
    }
  })
})

test('can read the row', t=> {
  t.plan(1)
  client.getItem({
    TableName,
    Key: {
      accountID: {S:'fake-account-id'}
    }
  },
  function _desc(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got result')
      console.log(result)
    }
  })
})

test('can query the row', t=> {
  t.plan(1)
  client.query({
    TableName,
    IndexName: 'mockapp-production-accounts-email-index',
    KeyConditions: {
      email: {
        AttributeValueList: [{S: 'person@email.lol'}],
        ComparisonOperator: 'EQ'
      }
    }
  },
  function _desc(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(result, 'got result')
      console.log(result)
    }
  })
})

test('db.close', t=> {
  t.plan(1)
  server.close()
  t.ok(true, 'db closed')
})
