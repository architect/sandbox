let test = require('tape')
let { join } = require('path')
let inv = require('@architect/inventory')
let sut = join(process.cwd(), 'src', 'tables', 'create-table', '_get-attribute-definitions')
let getDefns = require(sut)

let partitionOnly = {
  partitionKey: 'something',
  partitionKeyType: 'String',
}
let partitionAndSort = {
  partitionKey: 'another-thing',
  partitionKeyType: 'String',
  sortKey: 'something-else',
  sortKeyType: 'Number',
}

let inventory
test('Get inventory', t => {
  t.plan(1)
  let cwd =  join(process.cwd(), 'test', 'mock', 'normal')
  inv({ cwd }, function (err, result) {
    if (err) t.end(err)
    else {
      inventory = result
      t.ok(inv, 'Got inventory')
    }
  })
})

test('Get DynamoDB AttributeDefinitions (partition key only, manually injected)', t => {
  t.plan(3)
  let result = getDefns({ table: partitionOnly, inventory, oob: true })
  t.equal(result.length, 1, 'Got back one attribute definition')
  t.equal(result[0].AttributeName, partitionOnly.partitionKey, `Got back correct attribute name`)
  t.equal(result[0].AttributeType, 'S', `Got back correct attribute type`)
})

test('Get DynamoDB AttributeDefinitions (partition key + GSI, user defined)', t => {
  t.plan(5)
  let result = getDefns({ table: { name: 'accounts' }, inventory })
  t.equal(result.length, 2, 'Got back one attribute definition')
  t.equal(result[0].AttributeName, 'accountID', `Got back correct attribute name`)
  t.equal(result[0].AttributeType, 'S', `Got back correct attribute type`)
  t.equal(result[1].AttributeName, 'email', `Got back correct attribute name`)
  t.equal(result[1].AttributeType, 'S', `Got back correct attribute type`)
})

test('Get DynamoDB AttributeDefinitions (partition and sort keys, manually injected)', t => {
  t.plan(5)
  let result = getDefns({ table: partitionAndSort, inventory, oob: true })
  t.equal(result.length, 2, 'Got back one attribute definition')
  t.equal(result[0].AttributeName, partitionAndSort.partitionKey, `Got back correct attribute name`)
  t.equal(result[0].AttributeType, 'S', `Got back correct attribute type`)
  t.equal(result[1].AttributeName, partitionAndSort.sortKey, `Got back correct attribute name`)
  t.equal(result[1].AttributeType, 'N', `Got back correct attribute type`)
})

test('Get DynamoDB AttributeDefinitions (partition key + multiple GSIs, user defined)', t => {
  // Note: the GSIs in this mock share key names
  // Thus, we demonstrate reduced properties; there aren't more attribues just because more GSIs
  t.plan(5)
  let result = getDefns({ table: { name: 'pets' }, inventory })
  t.equal(result.length, 2, 'Got back one attribute definition')
  t.equal(result[0].AttributeName, 'accountID', `Got back correct attribute name`)
  t.equal(result[0].AttributeType, 'S', `Got back correct attribute type`)
  t.equal(result[1].AttributeName, 'petID', `Got back correct attribute name`)
  t.equal(result[1].AttributeType, 'S', `Got back correct attribute type`)
})
