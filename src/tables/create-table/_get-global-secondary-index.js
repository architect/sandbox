module.exports = function _getGSI (params) {
  let { name, inventory } = params
  let { inv, get } = inventory

  // Get all indexes that correspond to the table in question
  let table = get.tables(name)
  let indexes = table && inv?.indexes?.filter(({ name }) => name === table.name)

  if (indexes?.length) {
    return indexes.map(index => {
      let { partitionKey, partitionKeyType, sortKey } = index
      if (!partitionKey || !partitionKeyType) {
        throw Error(`Invalid @indexes: ${name}`)
      }

      let s = sortKey ? `-${sortKey}` : '' // Naming extension for multi-keys
      let IndexName = index.indexName
      if (!IndexName) IndexName = `${partitionKey}${s}-index`

      // Always add the partition key (HASH)
      let KeySchema = [ {
        AttributeName: partitionKey,
        KeyType: 'HASH'
      } ]

      // Maybe add the sort key (RANGE)
      if (sortKey) {
        KeySchema.push({
          AttributeName: sortKey,
          KeyType: 'RANGE'
        })
      }

      let params = {
        IndexName,
        KeySchema,
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
      return params
    })
  }
  else return false
}
