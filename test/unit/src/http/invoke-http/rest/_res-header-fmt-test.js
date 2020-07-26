let test = require('tape')
let responseHeaderFormatter = require('../../../../../../src/http/invoke-http/rest/_res-header-fmt')

test('Set up env', t => {
  t.plan(1)
  t.ok(responseHeaderFormatter, 'Module is present')
})

test('Header mangling', t => {
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

  let headers = responseHeaderFormatter(normal)
  t.equal(Object.keys(headers).length, Object.keys(normal).length, 'Got back the correct number of response headers')

  for (let [ key, value ] of Object.entries(normal)) {
    let mangled = key.toLowerCase()
    t.equal(headers[mangled], value, `Lowercased and got back correct response header for: ${mangled}`)
  }
})

test('Header remapping', t => {
  let remapped = {
    'authorization': 'authorization value',
    'connection': 'connection value',
    'content-length': 'content-length value',
    'content-md5': 'content-md5 value',
    'date': 'date value',
    'expect': 'expect value',
    'host': 'host value',
    'max-forwards': 'max-forwards value',
    'proxy-authenticate': 'proxy-authenticate value',
    'server': 'server value',
    'trailer': 'trailer value',
    'upgrade': 'upgrade value',
    'user-agent': 'user-agent value',
    'www-authenticate': 'www-authenticate value',
  }
  t.plan(Object.keys(remapped).length + 1)

  let headers = responseHeaderFormatter(remapped)
  t.equal(Object.keys(headers).length, Object.keys(remapped).length, 'Got back the correct number of response headers')

  for (let [ key, value ] of Object.entries(remapped)) {
    let mangled = `x-amzn-remapped-${key.toLowerCase()}`
    t.equal(headers[mangled], value, `Remapped and got back correct response header for: ${mangled}`)
  }
})

test('Header drops', t => {
  t.plan(1)
  let reqHeaders = {
    'ok': 'fine', // Should come through
    'transfer-encoding': 'whatev',
  }
  let headers = responseHeaderFormatter(reqHeaders)
  t.equal(Object.keys(headers).length, 1, 'Dropped appropriate headers')
})
