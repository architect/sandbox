let test = require('tape')
let { join } = require('path')
let sut = join(process.cwd(), 'src', 'tables', 'create-table', '_get-key-schema')
let getKeySchema = require(sut)

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

test('Get DynamoDB key schema (partition key only)', t => {
  t.plan(3)
  let result = getKeySchema(partitionOnly)
  t.equal(result.length, 1, 'Got back one attribute definition')
  t.equal(result[0].AttributeName, partitionOnly.partitionKey, `Got back correct attribute name`)
  t.equal(result[0].KeyType, 'HASH', `Got back correct attribute type`)
})

test('Get DynamoDB key schema (partition and sort keys)', t => {
  t.plan(5)
  let result = getKeySchema(partitionAndSort)
  t.equal(result.length, 2, 'Got back one attribute definition')
  t.equal(result[0].AttributeName, partitionAndSort.partitionKey, `Got back correct attribute name`)
  t.equal(result[0].KeyType, 'HASH', `Got back correct attribute type`)
  t.equal(result[1].AttributeName, partitionAndSort.sortKey, `Got back correct attribute name`)
  t.equal(result[1].KeyType, 'RANGE', `Got back correct attribute type`)
})

test('Invalid partition and sort key types', t => {
  t.plan(2)
  t.throws(() => {
    getKeySchema({
      partitionKey: 'another-thing',
      partitionKeyType: 'whatev',
    }, 'Threw on invalid partition key')
  })
  t.throws(() => {
    getKeySchema({
      partitionKey: 'another-thing',
      partitionKeyType: 'String',
      sortKey: 'something-else',
      sortKeyType: 'whatev',
    }, 'Threw on invalid sort key')
  })
})
