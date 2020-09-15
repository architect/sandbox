module.exports = function _getGSI (name, indexes) {
  let tableName = name.split(/staging-|production-/)[1]
  let actual = indexes.filter(index => Object.prototype.hasOwnProperty.call(index, tableName))
  if (actual.length >= 1) {
    return actual.map(idx => {
      let keys = Object.keys(idx[tableName])
      if (keys.length > 2 || keys.length < 1) {
        throw Error(`@indexes ${tableName} has wrong number of keys`)
      }
      let hasOneKey = keys.length === 1
      let hasTwoKeys = keys.length === 2

      let deprecated = process.env.DEPRECATED
      let singleKey = deprecated
        ? `${name}-${keys[0]}-index` // Old school index naming
        : `${keys[0]}-index` // New school index naming
      let multiKey = deprecated
        ? `${name}-${keys[0]}-${keys[1]}-index`
        : `${keys[0]}-${keys[1]}-index`

      let IndexName = hasOneKey ? singleKey : multiKey
      // always add the HASH key (partition)
      let KeySchema = [ {
        AttributeName: keys[0],
        KeyType: 'HASH'
      } ]
      // maybe add the RANGE key (sort)
      if (hasTwoKeys) {
        KeySchema.push({
          AttributeName: keys[1],
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
  else {
    return false
  }
}
