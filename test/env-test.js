let test = require('tape')
let sandbox = require('../')

test('sandbox', t=> {
  t.plan(2)
  t.ok(sandbox, 'sandbox exists')
  t.ok(typeof sandbox === 'object', 'is an object')
  console.log(sandbox)
})
