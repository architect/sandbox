let test = require('tape')
let { join } = require('path')
let sut = join(process.cwd(), 'src', 'http', 'invoke-http', 'http', '_req-header-fmt')
let requestHeaderFormatter = require(sut)
let params = {
  req: { socket: { localPort: 1234 } },
  ip: 'bar',
}

test('Set up env', t => {
  t.plan(1)
  t.ok(requestHeaderFormatter, 'Module is present')
})

test('Basics', t => {
  t.plan(2)
  let result = requestHeaderFormatter({}, params)
  t.ok(result.headers, 'Got back headers')
  t.notOk(result.cookies, 'Did not get back cookies without headers')
})

test('Header mangling & cookies (HTTP)', t => {
  t.plan(11)
  let reqHeaders = {
    authorization: 'whatev',
    cookie: 'foo=bar; fiz=buz',
    Foo: 'bar',
  }
  let { headers, cookies } = requestHeaderFormatter(reqHeaders, params)
  // Positive casing checks
  t.ok(headers.authorization, 'Got back lowcased authorization')
  t.ok(headers.foo, 'Got back lowcased foo')
  // Negative casing checks (ensure no dupes)
  t.notOk(headers.Authorization, 'Did not get back upcased Authorization')
  t.notOk(headers.Foo, 'Did not get back upcased Foo')
  // Cookies
  t.ok(Array.isArray(cookies), 'Got back cookies array')
  t.equal(cookies.length, 2, 'Got back two cookies')
  t.equal(cookies[0], 'foo=bar', 'Got back cookie one')
  t.equal(cookies[1], 'fiz=buz', 'Got back cookie two')
  // Metadata
  t.equal(headers['x-forwarded-for'], 'bar', 'Got back header: x-forwarded-for')
  t.equal(headers['x-forwarded-port'], '1234', 'Got back header: x-forwarded-port')
  t.equal(headers['x-forwarded-proto'], 'http', 'Got back header: x-forwarded-proto')
})

test('Header drops (HTTP)', t => {
  t.plan(1)
  let reqHeaders = {
    'ok': 'fine', // Should come through, everything else not so much
    'connection': 'whatev',
    'expect': 'whatev',
    'proxy-authenticate': 'whatev',
    'te': 'whatev',
    'transfer-encoding': 'whatev',
    'upgrade': 'whatev',
  }
  let { headers } = requestHeaderFormatter(reqHeaders, params)
  t.equal(Object.keys(headers).length, 4, 'Dropped appropriate headers')
})
