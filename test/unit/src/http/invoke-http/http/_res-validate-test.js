let test = require('tape')
let { join } = require('path')
let sut = join(process.cwd(), 'src', 'http', 'invoke-http', 'http', '_res-validate')
let responseValidator = require(sut)

function newRes () {
  return {
    setHeader: () => {}
  }
}

test('Set up env', t => {
  t.plan(1)
  t.ok(responseValidator, 'Got responseValidator module')
})

/**
 * Arc v6 (HTTP)
 */
test('Arc v6 control response (HTTP)', t => {
  t.plan(2)

  let res = newRes()
  // Exercise all standard params
  let result = {
    statusCode: 200,
    body: 'hi',
    headers: { hi: 'there' },
    cookies: [ 'hi', 'there' ],
    isBase64Encoded: true
  }
  let check = responseValidator({ res, result })
  t.notOk(res.statusCode, `Valid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.valid, `Valid response returned valid: ${check.valid}`)
})

test('Arc v6 response validity (HTTP)', t => {
  t.plan(23)

  let res
  let check
  let result

  /**
   * No return
   */
  res = newRes()
  check = responseValidator({ res })
  t.notOk(res.statusCode, `Valid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.valid, `Valid response returned valid: ${check.valid}`)

  /**
   * statusCode
   */
  res = newRes()
  result = { statusCode: 'idk' }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.body.includes('statusCode'), `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * body
   */
  // Invalid bodies (but only with statusCode)
  res = newRes()
  result = {
    statusCode: 200,
    body: Buffer.from('hi')
  }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.body.includes('buffer'), `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  res = newRes()
  result = {
    statusCode: 200,
    body: { hi: 'there' }
  }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.body.includes('body'), `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * headers
   */
  res = newRes()
  result = { headers: 'hi' }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.body.includes('headers'), `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  res = newRes()
  result = { headers: [ 'hi', 'there' ] }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.body.includes('headers'), `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * cookies
   */
  res = newRes()
  result = { cookies: 'hi' }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.body.includes('cookies'), `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * isBase64Encoded
   */
  res = newRes()
  result = { isBase64Encoded: 'hi' }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.body.includes('isBase64Encoded'), `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)
})
