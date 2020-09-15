let test = require('tape')
let getDefns = require('../../../../../src/tables/create-table/_get-attribute-definitions-with-gsi.js')

test('should not create duplicate table attribute definitions when indices reference a base table attribute definition', t => {
  t.plan(2)
  let baseAttrs = { PK: '*String', SK: '**String' }
  let tableName = 'staging-foo'
  let indexAttrs = [ { foo: { PK: '*String', timestamp: '**String' } } ]
  let result = getDefns(baseAttrs, tableName, indexAttrs)
  t.equals(result.length, 3, 'correct length on generated table attributes (dupes removed)')
  t.equals(result.filter(a => a.AttributeName === 'PK').length, 1, 'only one PK:S attribute found')
})
