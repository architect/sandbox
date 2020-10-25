module.exports = function getAttributeDefinitions (params) {
  let { name, inventory, table, oob } = params
  let { get } = inventory

  // oob is Sandbox default tables; otherwise it's userland
  let theTable = oob ? [ table ] : [ get.tables(name) ]
  let indexes = get.indexes(name) || []

  let defs = []
  theTable.concat(indexes).forEach(i => {
    let { partitionKey, partitionKeyType, sortKey, sortKeyType } = i

    // Always handle partition key
    defs.push({
      AttributeName: partitionKey,
      AttributeType: convert(partitionKeyType)
    })

    // Handle sort key if necessary
    if (sortKey) {
      defs.push({
        AttributeName: sortKey,
        AttributeType: convert(sortKeyType)
      })
    }
  })

  return defs
}

function convert (v) {
  return ({
    'String': 'S',
    'Number': 'N'
  })[v]
}
