let test = require('tape')
let { join } = require('path')
let sut = join(process.cwd(), 'src', 'http', 'invoke-http', 'rest', '_req-header-fmt')
let headerFormatter = require(sut)
let params = {
  req: { socket: { localPort: 1234 } },
  ip: 'bar',
}

test('Set up env', t => {
  t.plan(1)
  t.ok(headerFormatter, 'Module is present')
})

test('Basics', t => {
  t.plan(2)
  let result = headerFormatter({}, undefined, params)
  t.ok(result.headers, 'Got back headers')
  t.ok(result.multiValueHeaders, 'Got back multiValueHeaders')
})

/**
 * Arc v6 (HTTP + Lambda 1.0 payload)
 */
test('Header mangling (HTTP + Lambda 1.0 payload)', t => {
  t.plan(30)
  let reqHeaders = {
    authorization: 'whatev',
    host: 'whatev',
    'user-agent': 'whatev',
    date: 'whatev',
    Foo: 'bar'
  }
  let { headers, multiValueHeaders } = headerFormatter(reqHeaders, true, params)
  // Positive casing checks
  t.ok(headers.authorization, 'Got back lowcased authorization')
  t.ok(headers.Host, 'Got back upcased Host')
  t.ok(headers['User-Agent'], 'Got back upcased User-Agent')
  t.ok(headers['X-Forwarded-For'], 'Got back upcased X-Forwarded-For')
  t.equal(headers['X-Forwarded-Port'], '1234', 'Got back upcased X-Forwarded-Port')
  t.ok(headers['X-Forwarded-Proto'], 'Got back upcased X-Forwarded-Proto')
  t.ok(headers.date, 'Got back lowcased date')
  t.ok(headers.foo, 'Got back lowcased foo')
  t.ok(multiValueHeaders.authorization, 'Got back lowcased authorization')
  t.ok(multiValueHeaders.Host, 'Got back upcased Host')
  t.ok(multiValueHeaders['User-Agent'], 'Got back upcased User-Agent')
  t.ok(multiValueHeaders['X-Forwarded-For'], 'Got back upcased X-Forwarded-For')
  t.deepEqual(multiValueHeaders['X-Forwarded-Port'], [ '1234' ], 'Got back upcased X-Forwarded-Port')
  t.ok(multiValueHeaders['X-Forwarded-Proto'], 'Got back upcased X-Forwarded-Proto')
  t.ok(multiValueHeaders.date, 'Got back lowcased date')
  t.ok(multiValueHeaders.foo, 'Got back lowcased foo')
  // Negative casing checks (ensure no dupes)
  t.notOk(headers.Authorization, 'Did not get back upcased Authorization')
  t.notOk(headers.host, 'Did not get back lowcased host')
  t.notOk(headers['user-agent'], 'Did not get back lowcased user-agent')
  t.notOk(headers['x-forwarded-for'], 'Did not get back lowcased x-forwarded-for')
  t.notOk(headers['x-forwarded-port'], 'Did not get back lowcased x-forwarded-port')
  t.notOk(headers['x-forwarded-proto'], 'Did not get back lowcased x-forwarded-proto')
  t.notOk(headers.Date, 'Did not get back upcased Date')
  t.notOk(multiValueHeaders.Authorization, 'Did not get back upcased Authorization')
  t.notOk(multiValueHeaders.host, 'Did not get back lowcased host')
  t.notOk(multiValueHeaders['user-agent'], 'Did not get back lowcased user-agent')
  t.notOk(multiValueHeaders['x-forwarded-for'], 'Did not get back lowcased x-forwarded-for')
  t.notOk(multiValueHeaders['x-forwarded-port'], 'Did not get back lowcased x-forwarded-port')
  t.notOk(multiValueHeaders['x-forwarded-proto'], 'Did not get back lowcased x-forwarded-proto')
  t.notOk(multiValueHeaders.Date, 'Did not get back upcased Date')
})

test('Header drops (HTTP + Lambda 1.0 payload)', t => {
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
  let { headers, multiValueHeaders } = headerFormatter(reqHeaders, true, params)
  t.equal(Object.keys(headers).length, 9, 'Dropped appropriate headers')
  t.equal(Object.keys(multiValueHeaders).length, 9, 'Dropped appropriate multiValueHeaders')
})

/**
 * Arc v6 (REST)
 */
test('Header mangling (REST)', t => {
  t.plan(30)
  let reqHeaders = {
    authorization: 'whatev',
    host: 'whatev',
    'user-agent': 'whatev',
    date: 'whatev',
    Foo: 'bar'
  }
  let { headers, multiValueHeaders } = headerFormatter(reqHeaders, undefined, params)
  // Positive casing checks
  t.ok(headers.Authorization, 'Got back upcased Authorization')
  t.ok(headers.Host, 'Got back upcased Host')
  t.ok(headers['User-Agent'], 'Got back upcased User-Agent')
  t.ok(headers['X-Forwarded-For'], 'Got back upcased X-Forwarded-For')
  t.equal(headers['X-Forwarded-Port'], '1234', 'Got back upcased X-Forwarded-Port')
  t.ok(headers['X-Forwarded-Proto'], 'Got back upcased X-Forwarded-Proto')
  t.ok(headers.Date, 'Got back upased Date')
  t.ok(headers.foo, 'Got back lowcased foo')
  t.ok(multiValueHeaders.Authorization, 'Got back upcased Authorization')
  t.ok(multiValueHeaders.Host, 'Got back upcased Host')
  t.ok(multiValueHeaders['User-Agent'], 'Got back upcased User-Agent')
  t.ok(multiValueHeaders['X-Forwarded-For'], 'Got back upcased X-Forwarded-For')
  t.deepEqual(multiValueHeaders['X-Forwarded-Port'], [ '1234' ], 'Got back upcased X-Forwarded-Port')
  t.ok(multiValueHeaders['X-Forwarded-Proto'], 'Got back upcased X-Forwarded-Proto')
  t.ok(multiValueHeaders.Date, 'Got back upased Date')
  t.ok(multiValueHeaders.foo, 'Got back lowcased foo')
  // Negative casing checks (ensure no dupes)
  t.notOk(headers.authorization, 'Did not get back lowcased authorization')
  t.notOk(headers.host, 'Did not get back lowcased host')
  t.notOk(headers['user-agent'], 'Did not get back lowcased user-agent')
  t.notOk(headers['x-forwarded-for'], 'Did not get back lowcased x-forwarded-for')
  t.notOk(headers['x-forwarded-port'], 'Did not get back lowcased x-forwarded-port')
  t.notOk(headers['x-forwarded-proto'], 'Did not get back lowcased x-forwarded-proto')
  t.notOk(headers.date, 'Did not get back lowcased date')
  t.notOk(multiValueHeaders.authorization, 'Did not get back lowcased authorization')
  t.notOk(multiValueHeaders.host, 'Did not get back lowcased host')
  t.notOk(multiValueHeaders['user-agent'], 'Did not get back lowcased user-agent')
  t.notOk(multiValueHeaders['x-forwarded-for'], 'Did not get back lowcased x-forwarded-for')
  t.notOk(multiValueHeaders['x-forwarded-port'], 'Did not get back lowcased x-forwarded-port')
  t.notOk(multiValueHeaders['x-forwarded-proto'], 'Did not get back lowcased x-forwarded-proto')
  t.notOk(multiValueHeaders.date, 'Did not get back lowcased date')
})

test('Header drops (REST)', t => {
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
  let { headers, multiValueHeaders } = headerFormatter(reqHeaders, undefined, params)
  t.equal(Object.keys(headers).length, 4, 'Dropped appropriate headers')
  t.equal(Object.keys(multiValueHeaders).length, 4, 'Dropped appropriate multiValueHeaders')
})
