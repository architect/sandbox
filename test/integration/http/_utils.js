let sandbox = require('../../../src')
let tiny = require('tiny-json-http')
let url = `http://localhost:${process.env.PORT || 3333}`
let data = { hi: 'there' }
let b64dec = i => Buffer.from(i, 'base64').toString()
let has = (r, p) => Object.hasOwnProperty.call(r, p)

// Verify sandbox shut down
let verifyShutdown = (t, err) => {
  t.equal(err.code, 'ECONNREFUSED', 'Sandbox succssfully shut down')
}

let shutdown = t => {
  sandbox.end((err, result) => {
    if (err) t.fail(err)
    if (result !== 'Sandbox successfully shut down') {
      t.fail('Did not get back Sandbox shutdown message')
    }
    tiny.get({
      url
    }, err => {
      if (err) verifyShutdown(t, err)
      else t.fail('Sandbox did not shut down')
    })
  })
}

let shutdownAsync = async t => {
  let result = await sandbox.end()
  if (result !== 'Sandbox successfully shut down') {
    t.fail('Did not get back Sandbox shutdown message')
  }
  try {
    await tiny.get({ url })
    t.fail('Sandbox did not shut down')
  }
  catch (err) {
    verifyShutdown(t, err)
  }
}

// Ok, I know this is a bit ridiculous, but I really don't want to have to manually check every param, so let's automate as many checks possible
let msgs = {
  correct: 'Returned correct param',
  returned: 'Returned unverified param',
  notReturned: 'Did not return'
}

function checkHttpResult (t, result, checks) {
  t.ok(result, 'Got result!')
  let { version, body, routeKey, rawPath, requestContext } = result
  if (has(result, 'version')) {
    t.equal(version, '2.0', 'Got Lambda v2.0 payload')
  }
  else t.fail('No Lambda payload version specified')
  Object.entries(checks).forEach(([ param, value ]) => {
    if (param.startsWith('_')) { /* noop */ }
    else if (param === 'body' && value) {
      t.equal(body, JSON.stringify(data), 'Got JSON-serialized body payload')
    }
    else if (value === undefined) {
      t.ok(!has(result, param), `${msgs.notReturned}: ${param}`)
    }
    else if (param === 'pathParameters' ||
             param === 'queryStringParameters' ||
             param === 'cookies') {
      let val = JSON.stringify(value)
      t.equal(JSON.stringify(result[param]), val, `${msgs.correct} ${param}: ${val}`)
    }
    else if (value === '🤷🏽‍♀️') {
      t.ok(has(result, param), `${msgs.returned} ${param}`)
    }
    else {
      t.equal(result[param], value, `${msgs.correct} ${param}: ${value}`)
    }
  })
  let method = checks._method || routeKey.split(' ')[0]
  t.equal(requestContext.http.method, method, `Got correct requestContext.http.method param: ${method}`)
  t.equal(requestContext.http.path, rawPath, `Got correct requestContext.http.path param: ${rawPath}`)
  t.equal(requestContext.routeKey, routeKey, `Got correct requestContext.routeKey param: ${routeKey}`)
}

function checkRestResult (t, result, checks) {
  t.ok(result, 'Got result!')
  let { version, body, path, pathParameters, httpMethod, resource, requestContext } = result
  if (has(result, 'version')) {
    t.equal(version, '1.0', 'Got Lambda v1.0 payload')
  }
  else {
    t.notOk(version, 'No Lambda payload version specified')
  }
  Object.entries(checks).forEach(([ param, value ]) => {
    if (param.startsWith('_')) { /* noop */ }
    else if (param === 'body' && value) {
      t.equal(b64dec(body), JSON.stringify(data), 'Got JSON-serialized body payload')
    }
    else if (value === undefined) {
      t.ok(!has(result, param), `${msgs.notReturned}: ${param}`)
    }
    else if (param === 'pathParameters' ||
             param === 'queryStringParameters' ||
             param === 'multiValueQueryStringParameters') {
      let val = JSON.stringify(value)
      t.equal(JSON.stringify(result[param]), val, `${msgs.correct} ${param}: ${val}`)
    }
    else if (value === '🤷🏽‍♀️') {
      t.ok(has(result, param), `${msgs.returned} ${param}`)
    }
    else {
      t.equal(result[param], value, `${msgs.correct} ${param}: ${value}`)
    }
  })
  t.equal(requestContext.httpMethod, httpMethod, `Got correct requestContext.httpMethod param: ${httpMethod}`)
  t.equal(requestContext.path, path, `Got correct requestContext.path param: ${path}`)
  t.equal(requestContext.resourcePath, resource, `Got correct requestContext.resourcePath param: ${path}`)
}

module.exports = { url, data, verifyShutdown, shutdown, shutdownAsync, checkHttpResult, checkRestResult }
