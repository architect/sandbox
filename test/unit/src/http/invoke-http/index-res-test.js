let test = require('tape')
let sinon = require('sinon')
let proxyquire = require('proxyquire')
let lambdaStub = sinon.stub().yields()
let invoke = proxyquire('../../../../../src/http/invoke-http', {
  '../../invoke-lambda': lambdaStub
})
let responses = require('../http-res-fixtures')

let b64dec = i => Buffer.from(i, 'base64').toString('utf8')
let str = i => JSON.stringify(i)
let match = (copy, item) => `${copy} matches: ${item}`
let input = {
  url: 'http://localhost:6666',
  body: {},
  headers: { 'Accept-Encoding': 'gzip' },
  params: {}
}
let getHeader = (type, header) => {
  if (header && header.toLowerCase() === 'cache-control') return undefined
  if (header && header.toLowerCase() === 'content-type') return type || 'application/json; charset=utf-8'
}
let parseOutput = output => {
  // Reconstructs response from Sinon stub
  let res = {
    body: output.end.args[0][0],
    headers: {}
  }
  output.setHeader.args.forEach(arg => {
    let key = arg[0]
    let value = arg[1]
    res.headers[key] = value
  })
  if (output.statusCode) res.statusCode = output.statusCode
  if (output.isBase64Encoded) res.isBase64Encoded = output.isBase64Encoded
  return res
}
let teardown = () => {
  lambdaStub.reset() // mostly jic
  delete process.env.DEPRECATED
}

test('Architect v6 dependency-free responses (REST API mode)', t => {
  t.plan(13)
  let run = (response, callback) => {
    let output = {
      getHeader: sinon.fake(getHeader.bind({}, null)),
      removeHeader: sinon.fake.returns(true),
      statusCode: sinon.fake.returns(),
      setHeader: sinon.fake.returns(),
      end: sinon.fake.returns()
    }
    lambdaStub.yields(null, response)
    let handler = invoke({ verb: 'GET', route: '/', apiType: 'rest' })
    handler(input, output)
    let res = parseOutput(output)
    callback(res)
  }
  run(responses.arc6.isBase64Encoded, res => {
    t.equal(b64dec(responses.arc6.isBase64Encoded.body), b64dec(res.body), match('res.body', res.body))
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })
  run(responses.arc6.buffer, res => {
    t.ok(res.body.includes('Cannot respond with a raw buffer'), 'Raw buffer response causes error')
    t.equal(res.statusCode, 502, 'Responded with 502')
  })
  run(responses.arc6.encodedWithBinaryType, res => {
    t.ok(typeof res.body === 'string', 'Body is (likely) base64 encoded')
    t.equal(b64dec(res.body), 'hi there\n', 'Body still base64 encoded')
    t.notOk(res.isBase64Encoded, 'isBase64Encoded param NOT set automatically')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })
  run(responses.arc6.multiValueHeaders, res => {
    t.deepEqual(res.headers['set-cookie'], [ 'Foo', 'Bar', 'Baz' ], 'Header values set')
    t.deepEqual(res.headers['content-type'], [ 'text/plain' ], 'Content-Type favors multiValueHeaders')
  })
  run(responses.arc5.cookie, res => {
    t.ok(res.body.includes('Invalid response parameter'), 'Arc v5 style parameter causes error')
    t.equal(res.statusCode, 502, 'Responded with 502')
  })
  teardown()
})

test('Architect v5 dependency-free responses (REST API mode)', t => {
  t.plan(9)
  process.env.DEPRECATED = true
  let run = (response, callback) => {
    let output = {
      getHeader: sinon.fake(getHeader.bind({}, null)),
      removeHeader: sinon.fake.returns(true),
      statusCode: sinon.fake.returns(),
      setHeader: sinon.fake.returns(),
      end: sinon.fake.returns()
    }
    lambdaStub.yields(null, response)
    let handler = invoke({ verb: 'GET', route: '/', apiType: 'rest' })
    handler(input, output)
    let res = parseOutput(output)
    callback(res)
  }
  run(responses.arc5.type, res => {
    t.equal(responses.arc5.type.type, res.headers['Content-Type'], `type matches res.headers['Content-Type']: ${res.headers['Content-Type']}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })
  // Testing that cookie is set, not that a valid cookie was passed
  responses.arc5.cookie.cookie = '_idx=foo'
  run(responses.arc5.cookie, res => {
    t.ok(res.headers['Set-Cookie'].includes('_idx='), `Cookie set: ${res.headers['Set-Cookie'].substr(0, 75)}...`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })
  run(responses.arc5.cors, res => {
    t.equal(res.headers['Access-Control-Allow-Origin'], '*', `CORS boolean set res.headers['Access-Control-Allow-Origin'] === '*'`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })
  run(responses.arc5.isBase64Encoded, res => {
    // responses.arc5.isBase64Encoded.body mutated by invoke, so this test is not amazing ↓
    t.equal(responses.arc5.isBase64Encoded.body, res.body, match('res.body', res.body))
    t.ok(res.isBase64Encoded, 'isBase64Encoded param passed through')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })
  teardown()
})

test('Architect v5 + Functions (REST API mode)', t => {
  t.plan(11)
  process.env.DEPRECATED = true
  let antiCache = 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
  // Output able to be out of run()'s scope here to be mutated by tests
  let output = {
    getHeader: sinon.fake(getHeader.bind({}, null)),
    removeHeader: sinon.fake.returns(true),
    statusCode: sinon.fake.returns(),
    setHeader: sinon.fake.returns(),
    end: sinon.fake.returns()
  }
  let run = (response, callback) => {
    lambdaStub.yields(null, response)
    let handler = invoke({ verb: 'GET', route: '/', apiType: 'rest' })
    handler(input, output)
    let res = parseOutput(output)
    callback(res)
  }
  output.getHeader = sinon.fake(getHeader.bind({}, null))
  run(responses.arc5.body, res => {
    t.equal(str(responses.arc5.body.body), str(res.body), match('res.body', res.body))
    t.equal(res.statusCode, 200, 'Responded with 200')
  })
  // Same getHeader for arc5.cacheControl as in arc5.body
  run(responses.arc5.cacheControl, res => {
    t.equal(responses.arc5.cacheControl.headers['cache-control'], res.headers['Cache-Control'], match(`res.headers['Cache-Control']`, res.headers['Cache-Control']))
    if (responses.arc5.cacheControl.headers['cache-control'] && !res.headers['cache-control'])
      t.pass(`Headers normalized and de-duped: ${str(res.headers)}`)
    t.equal(res.statusCode, 200, 'Responded with 200')
  })
  output.getHeader = sinon.fake(getHeader.bind({}, responses.arc5.noCacheControlHTML.headers['Content-Type']))
  run(responses.arc5.noCacheControlHTML, res => {
    t.equal(res.headers['Cache-Control'], antiCache, 'Default anti-caching headers set for HTML response')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })
  output.getHeader = sinon.fake(getHeader.bind({}, responses.arc5.noCacheControlOther.headers['Content-Type']))
  run(responses.arc5.noCacheControlOther, res => {
    let def = 'max-age=86400'
    t.equal(res.headers['Cache-Control'], def, 'Default caching headers set for non-HTML/JSON response')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })
  // The following is not a great test ↓
  //   with Sinon we have to mock the Content-Type fallback instead of letting it work
  output.getHeader = sinon.fake(getHeader.bind({}, null))
  run(responses.arc5.defaultsToJson, res => {
    t.ok(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    t.equal(res.statusCode, 200, 'Responded with 200')
  })
  teardown()
})

test('Architect <6 + Functions response params (REST API mode)', t => {
  t.plan(4)
  process.env.DEPRECATED = true
  let run = (response, callback) => {
    let output = {
      getHeader: sinon.fake(getHeader.bind({}, null)),
      removeHeader: sinon.fake.returns(true),
      statusCode: sinon.fake.returns(),
      setHeader: sinon.fake.returns(),
      end: sinon.fake.returns()
    }
    lambdaStub.yields(null, response)
    let handler = invoke({ verb: 'GET', route: '/', apiType: 'rest' })
    handler(input, output)
    let res = parseOutput(output)
    callback(res)
  }
  run(responses.arc.locationHi, res => {
    t.equal(responses.arc.locationHi.location, res.headers.Location, match('res.headers.Location', res.headers.Location))
  })
  run(responses.arc.status201, res => {
    t.equal(responses.arc.status201.status, res.statusCode, match('status', res.statusCode))
  })
  run(responses.arc.code201, res => {
    t.equal(responses.arc.code201.code, res.statusCode, match('code', res.statusCode))
  })
  run(responses.arc.statusCode201, res => {
    t.equal(responses.arc.statusCode201.statusCode, res.statusCode, match('statusCode', res.statusCode))
  })
  teardown()
})

test('invoke-http should replace cookie header with ssl and path modifications when lambda returns Architect v5 style response', t => {
  t.plan(1)
  process.env.DEPRECATED = true
  let handler = invoke({})
  lambdaStub.yields(null, {
    cookie: 'nomnom; Secure'
  })
  let req = input
  let res = {
    getHeader: sinon.fake(getHeader.bind({}, null)),
    removeHeader: sinon.fake.returns(true),
    statusCode: sinon.fake.returns(),
    setHeader: sinon.fake.returns(),
    end: sinon.fake.returns()
  }
  handler(req, res)
  t.ok(res.setHeader.calledWith('Set-Cookie', 'nomnom; Path=/'), 'setHeader called with modified cookie')
  teardown()
})

test('invoke-http should replace cookie header with ssl and path modifications when lambda returns Architect v6 style response', t => {
  t.plan(1)
  let handler = invoke({ apiType: 'rest' })
  lambdaStub.yields(null, {
    headers: {
      'Set-Cookie': 'nomnom; Secure'
    }
  })
  let req = input
  let res = {
    getHeader: sinon.fake(getHeader.bind({}, null)),
    removeHeader: sinon.fake.returns(true),
    statusCode: sinon.fake.returns(),
    setHeader: sinon.fake.returns(),
    end: sinon.fake.returns()
  }
  handler(req, res)
  t.ok(res.setHeader.calledWith('set-cookie', 'nomnom; Path=/'), 'setHeader called with modified cookie')
  teardown()
})
