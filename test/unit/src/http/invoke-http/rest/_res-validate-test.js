let test = require('tape')
let { join } = require('path')
let sut = join(process.cwd(), 'src', 'http', 'invoke-http', 'rest', '_res-validate')
let responseValidator = require(sut)

function newRes () {
  return {
    setHeader: () => {}
  }
}

let data = { hi: 'there' }

test('Set up env', t => {
  t.plan(1)
  t.ok(responseValidator, 'Got responseValidator module')
})

/**
 * Arc v6 (HTTP + Lambda 1.0 payload)
 */
test('Arc v6 control response (HTTP + Lambda 1.0 payload)', t => {
  t.plan(2)

  let res = newRes()
  // Exercise all standard params
  let result = {
    statusCode: 200,
    body: 'hi',
    headers: data,
    multiValueHeaders: { hi: [ 'there', 'friend' ] },
    isBase64Encoded: true
  }
  let check = responseValidator({ res, result }, true)
  t.notOk(res.statusCode, `Valid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.valid, `Valid response returned valid: ${check.valid}`)
})

test('Arc v6 response validity (HTTP + Lambda 1.0 payload)', t => {
  t.plan(34)

  let res
  let check
  let result

  /**
   * Malformed
   */
  res = newRes()
  result = []
  check = responseValidator({ res, result }, true)
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /Handler must return an object/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * statusCode
   */
  res = newRes()
  result = { statusCode: 'idk' }
  check = responseValidator({ res, result }, true)
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /statusCode/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * body
   */
  // Invalid bodies
  res = newRes()
  result = { body: Buffer.from('hi') }
  check = responseValidator({ res, result }, true)
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /buffer/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  res = newRes()
  result = { body: data }
  check = responseValidator({ res, result }, true)
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /body/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  // This body is actually valid
  res = newRes()
  result = { body: 1337 }
  check = responseValidator({ res, result }, true)
  t.notOk(res.statusCode, `Valid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.valid, `Valid response returned valid: ${check.valid}`)


  /**
   * headers
   */
  res = newRes()
  result = { headers: 'hi' }
  check = responseValidator({ res, result }, true)
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /headers/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  res = newRes()
  result = { headers: [ 'hi', 'there' ] }
  check = responseValidator({ res, result }, true)
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /headers/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * multiValueHeaders
   */
  res = newRes()
  result = { multiValueHeaders: 'hi' }
  check = responseValidator({ res, result }, true)
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /multiValueHeaders/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  res = newRes()
  result = { multiValueHeaders: [ 'hi', 'there' ] }
  check = responseValidator({ res, result }, true)
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /multiValueHeaders/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  res = newRes()
  result = { multiValueHeaders: { 'hi': 'there' } }
  check = responseValidator({ res, result }, true)
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /multiValueHeaders/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * isBase64Encoded
   */
  res = newRes()
  result = { isBase64Encoded: 'hi' }
  check = responseValidator({ res, result }, true)
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /isBase64Encoded/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * Invalid params are ignored
   */
  res = newRes()
  result = data
  check = responseValidator({ res, result }, true)
  t.notOk(res.statusCode, `Invalid params are ignored, and do not set error statusCode: ${res.statusCode}`)
  t.ok(check.valid, `Valid response returned valid: ${check.valid}`)
})


/**
 * Arc v6 (REST)
 */
test('Arc v6 control response (REST API mode)', t => {
  t.plan(2)

  let res = newRes()
  // Exercise all standard params
  let result = {
    statusCode: 200,
    body: 'hi',
    headers: data,
    multiValueHeaders: { hi: [ 'there', 'friend' ] },
    isBase64Encoded: true
  }
  let check = responseValidator({ res, result })
  t.notOk(res.statusCode, `Valid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.valid, `Valid response returned valid: ${check.valid}`)
})

test('Arc v6 response validity (REST API mode)', t => {
  t.plan(35)

  let res
  let check
  let result

  /**
   * Malformed
   */
  res = newRes()
  result = []
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /Handler must return an object/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * statusCode
   */
  res = newRes()
  result = { statusCode: 'idk' }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /statusCode/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * body
   */
  // Invalid bodies
  res = newRes()
  result = { body: Buffer.from('hi') }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /buffer/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  res = newRes()
  result = { body: data }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /body/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  // This body is actually valid
  res = newRes()
  result = { body: 1337 }
  check = responseValidator({ res, result })
  t.notOk(res.statusCode, `Valid response did not set error statusCode: ${res.statusCode}`)
  t.ok(check.valid, `Valid response returned valid: ${check.valid}`)

  /**
   * headers
   */
  res = newRes()
  result = { headers: 'hi' }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /headers/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  res = newRes()
  result = { headers: [ 'hi', 'there' ] }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /headers/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * multiValueHeaders
   */
  res = newRes()
  result = { multiValueHeaders: 'hi' }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /multiValueHeaders/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  res = newRes()
  result = { multiValueHeaders: [ 'hi', 'there' ] }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /multiValueHeaders/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  res = newRes()
  result = { multiValueHeaders: { 'hi': 'there' } }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /multiValueHeaders/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * isBase64Encoded
   */
  res = newRes()
  result = { isBase64Encoded: 'hi' }
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /isBase64Encoded/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)

  /**
   * Invalid params
   */
  res = newRes()
  result = data
  check = responseValidator({ res, result })
  t.equal(res.statusCode, 502, `Invalid response did not set error statusCode: ${res.statusCode}`)
  t.match(check.body, /Invalid response parameter/, `Got relevant error message: ${check.body}`)
  t.equal(check.valid, false, `Invalid response returned valid: ${check.valid}`)
})
