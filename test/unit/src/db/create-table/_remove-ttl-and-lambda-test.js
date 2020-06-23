let clean = require('../../../../../src/db/create-table/_remove-ttl-and-lambda')
let test = require('tape')

test('_remove-ttl-and-lambda should ignore params with a value of TTL', t => {
  t.plan(2)
  let cleaned = clean({ key: 'value', _ttl: 'TTL' })
  t.equals(cleaned.key, 'value', 'did not remove legit value')
  t.notOk(cleaned._ttl, 'removed TTL param')
})

test('_remove-ttl-and-lambda should ignore stream param', t => {
  t.plan(2)
  let cleaned = clean({ key: 'value', stream: 'yes' })
  t.equals(cleaned.key, 'value', 'did not remove legit value')
  t.notOk(cleaned.stream, 'removed stream param')
})

test('_remove-ttl-and-lambda should ignore params with a value of Lambda', t => {
  t.plan(2)
  let cleaned = clean({ key: 'value', wut: 'Lambda' })
  t.equals(cleaned.key, 'value', 'did not remove legit value')
  t.notOk(cleaned.Lambda, 'removed Lambda param')
})

test('_remove-ttl-and-lambda should ignore encrypt param', t => {
  t.plan(2)
  let cleaned = clean({ key: 'value', encrypt: true })
  t.equals(cleaned.key, 'value', 'did not remove legit value')
  t.notOk(cleaned.encrypt, 'removed encrypt param')
})
