let { join } = require('path')
let test = require('tape')
let dynalite = require('dynalite')
let { tables } = require('../../src')
let getDBClient = require('../../src/tables/_get-db-client')
let dbPort = 4567
let dynaliteServer
let dynamo


test('Start external DB', t => {
  t.plan(1)
  process.env.ARC_DB_EXTERNAL = true
  process.env.ARC_TABLES_PORT = dbPort
  process.chdir(join(__dirname, '..', 'mock', 'external-db'))
  dynaliteServer = dynalite({ path: './.db', createTableMs: 0 })
  dynaliteServer.listen(dbPort, err => {
    if (err) t.fail(err)
    else t.equal(err, undefined, 'Dynalite listening...')
  })
})

test('Async tables.start', async t => {
  t.plan(1)
  try {
    let result = await tables.start({})
    t.equal(result, 'DynamoDB successfully started', 'Tables started')
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
  let err
  try {
    delete process.env.ARC_DB_EXTERNAL
    delete process.env.ARC_TABLES_PORT
    await tables.end()
  }
  catch (e) {
    err = e
  }
  t.equal(err, undefined, 'Calling tables.end did not throw error')
})

test('Stop external DB', t => {
  t.plan(1)
  dynaliteServer.close(err => {
    if (err) t.fail(err)
    else t.equal(err, undefined, 'DynamoDB successfully shut down')
  })
})
