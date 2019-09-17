let clean = require('./_remove-ttl-and-lambda')

// turns {foo:'*String', bar:'**String'}
// into [{AttributeName:'foo', AttributeType:'S'}, {AttributeName:'bar', AttributeType:'S'}]
function fixer(obj) {
  let result = []
  Object.keys(obj).forEach(AttributeName=> {
    result.push({
      AttributeName,
      AttributeType: obj[AttributeName].replace('**', '').replace('*', '').replace('Number', 'N').replace('String', 'S')
    })
  })
  return result
}

module.exports = function getAttributeDefinitions(attr, name, indexes) {

  let tableName = name.split(/staging-|production-/)[1]

  // an array of attributes from indexes [idx:'*String', ts:'**Number}] for example
  let actual = indexes.filter(index=> Object.prototype.hasOwnProperty.call(index, tableName)).map(x=> x[tableName])

  // interpolates attrs from table definitions and indexes
  let fixed = actual.map(fixer).concat(fixer(clean(attr))).reduce((a,b)=> a.concat(b))

  // an array of [{AttributeName, AttributeType}]
  return fixed
}

