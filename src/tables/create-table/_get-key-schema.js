let hashkeys = [
  'String',
  'Number',
  'HashString',
  'HashNumber',
  'PartitionString',
  'PartitionNumber'
]
let rangekeys = [
  'String',
  'Number',
  'RangeString',
  'RangeNumber',
  'SortString',
  'SortNumber'
]
function validate (k, keys) {
  if (!keys.includes(k)) throw Error(`Unknown key type: ${k}`)
}

module.exports = function getKeySchema (table) {
  let { partitionKey, partitionKeyType, sortKey, sortKeyType } = table

  // Always handle partition key
  validate(partitionKeyType, hashkeys)
  let schema = [ {
    AttributeName: partitionKey,
    KeyType: 'HASH'
  } ]

  // Handle sort key if necessary
  if (sortKey) {
    validate(sortKeyType, rangekeys)
    schema.push({
      AttributeName: sortKey,
      KeyType: 'RANGE'
    })
  }

  return schema
}
