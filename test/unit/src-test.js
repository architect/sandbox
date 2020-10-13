let test = require('tape')
let sandbox = require('../../src')

test('Sandbox', t => {
  t.plan(2)
  t.ok(sandbox, 'Sandbox exists!')
  t.ok(typeof sandbox === 'object', '... and is an object')
  console.log(sandbox)
})
