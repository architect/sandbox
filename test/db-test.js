let path = require('path')
let aws = require('aws-sdk')
let test = require('tape')
let {db} = require('../')

let client
test('db.start', t=> {
  t.plan(2)
  t.ok(db, 'got db')
  // move the current process into the mock dir
  process.chdir(path.join(__dirname, 'mock'))
  client = db.start(function() {
    t.ok(true, '@tables created in local database')
  })
})

test('can list tables', t=> {
  t.plan(1)
  let ddb = new aws.DynamoDB({endpoint: 'http://localhost:5000'})
  ddb.listTables({}, function done(err, result) {
    t.ok(Array.isArray(result.TableNames), 'got tables')
    console.log(result)
  })
})

test('db.close', t=> {
  t.plan(1)
  client.close()
  t.ok(true, 'db closed')
})
