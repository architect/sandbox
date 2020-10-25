let test = require('tape')
let { join } = require('path')
let inv = require('@architect/inventory')
let sut = join(process.cwd(), 'src', 'tables', 'create-table', '_get-global-secondary-index')
let getGSI = require(sut)

function checkBoilerplate (t, gsi) {
  let boilerplate = {
    Projection: { ProjectionType: 'ALL' },
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
  }
  gsi.forEach(i => {
    t.deepEqual({
      Projection: i.Projection,
      ProvisionedThroughput: i.ProvisionedThroughput
    }, boilerplate, 'Got back boilerplate projection + provisioned throughput params')
  })
}

let inventory
test('Get inventory', t => {
  t.plan(1)
  let cwd =  join(process.cwd(), 'test', 'mock', 'normal')
  inv({ cwd }, function (err, result) {
    if (err) t.fail(err)
    else {
      inventory = result
      t.ok(inv, 'Got inventory')
    }
  })
})

test('Get DynamoDB GSI (normal)', t => {
  t.plan(12)
  let gsi

  // Nada
  gsi = getGSI({ name: 'idk', inventory })
  t.notOk(gsi, 'Unknown table returns nothing')

  // Single GSI
  gsi = getGSI({ name: 'accounts', inventory })
  t.equal(gsi.length, 1, 'Got array with one GSI back')
  t.deepEqual(
    gsi[0].KeySchema,
    [ { AttributeName: 'email', KeyType: 'HASH' } ],
    'Got correct key schema'
  )
  t.equal(gsi[0].IndexName, 'email-index', `Got back correct index name: ${gsi[0].IndexName}`)
  checkBoilerplate(t, gsi)

  // Multiple GSIs + multi-keys
  gsi = getGSI({ name: 'pets', inventory })
  t.equal(gsi.length, 2, 'Got array with two GSIs back')
  t.deepEqual(
    gsi[0].KeySchema,
    [ { AttributeName: 'petID', KeyType: 'HASH' } ],
    'Got correct key schema'
  )
  t.equal(gsi[0].IndexName, 'petID-index', `Got back correct index name: ${gsi[0].IndexName}`)
  t.deepEqual(
    gsi[1].KeySchema,
    [
      { AttributeName: 'accountID', KeyType: 'HASH' },
      { AttributeName: 'petID', KeyType: 'RANGE' }
    ],
    'Got correct key schema'
  )
  t.equal(gsi[1].IndexName, 'accountID-petID-index', `Got back correct index name: ${gsi[0].IndexName}`)
  checkBoilerplate(t, gsi)
})

test('Get DynamoDB GSI (deprecated)', t => {
  t.plan(14)
  process.env.DEPRECATED = true
  t.ok(process.env.DEPRECATED, 'Deprecated mode enabled')

  let gsi
  let tableName = n => `${inventory.inventory.app}-staging-${n}`

  // Nada
  gsi = getGSI({ name: 'idk', inventory, TableName: tableName('idk') })
  t.notOk(gsi, 'Unknown table returns nothing')

  // Single GSI
  gsi = getGSI({ name: 'accounts', inventory, TableName: tableName('accounts') })
  t.equal(gsi.length, 1, 'Got array with one GSI back')
  t.deepEqual(
    gsi[0].KeySchema,
    [ { AttributeName: 'email', KeyType: 'HASH' } ],
    'Got correct key schema'
  )
  t.equal(gsi[0].IndexName, 'mockapp-staging-accounts-email-index', `Got back correct index name: ${gsi[0].IndexName}`)
  checkBoilerplate(t, gsi)

  // Multiple GSIs + multi-keys
  gsi = getGSI({ name: 'pets', inventory, TableName: tableName('pets') })
  t.equal(gsi.length, 2, 'Got array with two GSIs back')
  t.deepEqual(
    gsi[0].KeySchema,
    [ { AttributeName: 'petID', KeyType: 'HASH' } ],
    'Got correct key schema'
  )
  t.equal(gsi[0].IndexName, 'mockapp-staging-pets-petID-index', `Got back correct index name: ${gsi[0].IndexName}`)
  t.deepEqual(
    gsi[1].KeySchema,
    [
      { AttributeName: 'accountID', KeyType: 'HASH' },
      { AttributeName: 'petID', KeyType: 'RANGE' }
    ],
    'Got correct key schema'
  )
  t.equal(gsi[1].IndexName, 'mockapp-staging-pets-accountID-petID-index', `Got back correct index name: ${gsi[0].IndexName}`)
  checkBoilerplate(t, gsi)

  delete process.env.DEPRECATED
  t.notOk(process.env.DEPRECATED, 'Deprecated mode disabled')
})
