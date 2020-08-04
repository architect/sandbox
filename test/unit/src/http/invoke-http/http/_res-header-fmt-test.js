let test = require('tape')
let { join } = require('path')
let sut = join(process.cwd(), 'src', 'http', 'invoke-http', 'http', '_res-header-fmt')
let responseHeaderFormatter = require(sut)

test('Set up env', t => {
  t.plan(1)
  t.ok(responseHeaderFormatter, 'Module is present')
})

test('Basics', t => {
  t.plan(1)
  let result = responseHeaderFormatter()
  t.notOk(result, 'Invoking without headers returns nothing')
})

test('Header mangling (HTTP)', t => {
  let normal = {
    'Accept-Charset': 'Accept-Charset value',
    'Accept-Encoding': 'Accept-Encoding value',
    'Accept': 'Accept value',
    'Age': 'Age value',
    'Content-Encoding': 'Content-Encoding value',
    'Content-Type': 'Content-Type value',
    'Pragma': 'Pragma value',
    'Range': 'Range value',
    'Referer': 'Referer value',
    'TE': 'TE value',
    'Via': 'Via value',
    'Warn': 'Warn value',
  }
  t.plan(Object.keys(normal).length + 1)

  let headers = responseHeaderFormatter(normal, true)
  t.equal(Object.keys(headers).length, Object.keys(normal).length, 'Got back the correct number of response headers')

  for (let [ key, value ] of Object.entries(normal)) {
    let mangled = key.toLowerCase()
    t.equal(headers[mangled], value, `Lowercased and got back correct response header for: ${mangled}`)
  }
})

test('Header drops (HTTP)', t => {
  t.plan(1)
  let reqHeaders = {
    'ok': 'fine', // Should come through
    'content-length': 'content-length value',
    'date': 'date value',
    'upgrade': 'upgrade value',
    'transfer-encoding': 'whatev',
  }
  let headers = responseHeaderFormatter(reqHeaders)
  t.equal(Object.keys(headers).length, 1, 'Dropped appropriate headers')
})
