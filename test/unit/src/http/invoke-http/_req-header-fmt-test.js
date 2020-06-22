let test = require('tape')
let headerFormatter = require('../../../../../src/http/invoke-http/_req-header-fmt')

test('Set up env', t => {
  t.plan(1)
  t.ok(headerFormatter, 'Module is present')
})

test('Basics', t => {
  t.plan(2)
  let result = headerFormatter()
  t.ok(result.headers, 'Got back headers')
  t.ok(result.multiValueHeaders, 'Got back multiValueHeaders')
})

test('Header mangling', t => {
  t.plan(16)
  let reqHeaders = {
    authorization: 'whatev',
    host: 'whatev',
    'user-agent': 'whatev',
    date: 'whatev',
  }
  let { headers, multiValueHeaders } = headerFormatter(reqHeaders)
  // Upcasing
  t.ok(headers.Authorization, 'Got back upcased Authorization')
  t.ok(headers.Host, 'Got back upcased Host')
  t.ok(headers['User-Agent'], 'Got back upcased User-Agent')
  t.ok(headers.Date, 'Got back upcased Date')
  t.ok(multiValueHeaders.Authorization, 'Got back upcased Authorization')
  t.ok(multiValueHeaders.Host, 'Got back upcased Host')
  t.ok(multiValueHeaders['User-Agent'], 'Got back upcased User-Agent')
  t.ok(multiValueHeaders.Date, 'Got back upcased Date')
  // Lowcasing
  t.notOk(headers.authorization, 'Did not get back lowcased authorization')
  t.notOk(headers.host, 'Did not get back lowcased host')
  t.notOk(headers['user-agent'], 'Did not get back lowcased user-agent')
  t.notOk(headers.date, 'Did not get back lowcased date')
  t.notOk(multiValueHeaders.authorization, 'Did not get back lowcased authorization')
  t.notOk(multiValueHeaders.host, 'Did not get back lowcased host')
  t.notOk(multiValueHeaders['user-agent'], 'Did not get back lowcased user-agent')
  t.notOk(multiValueHeaders.date, 'Did not get back lowcased date')
})

test('Header drops', t => {
  t.plan(2)
  let reqHeaders = {
    'ok': 'fine', // Should come through, everything else not so much
    'connection': 'whatev',
    'content-md5': 'whatev',
    'expect': 'whatev',
    'max-forwards': 'whatev',
    'proxy-authenticate': 'whatev',
    'server': 'whatev',
    'te': 'whatev',
    'transfer-encoding': 'whatev',
    'trailer': 'whatev',
    'upgrade': 'whatev',
    'www-authenticate': 'whatev',
  }
  let { headers, multiValueHeaders } = headerFormatter(reqHeaders)
  t.equal(Object.keys(headers).length, 1, 'Dropped appropriate headers')
  t.equal(Object.keys(multiValueHeaders).length, 1, 'Dropped appropriate multiValueHeaders')
})
