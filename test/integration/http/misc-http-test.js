let { join } = require('path')
let { existsSync, statSync, writeFileSync } = require('fs')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { run, startup, shutdown, url } = require('../../utils')

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got Sandbox')
})

test('Run misc HTTP tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  t.test(`[Misc / ${runType}] Start Sandbox`, t => {
    startup[runType](t, 'normal')
  })

  t.test(`[Catchall / ${runType}] get /path - calls without trailing /* should fall through (and in this case fail)`, t => {
    t.plan(2)
    let path = '/path'
    tiny.get({
      url: url + path
    }, function _got (err, result) {
      if (err) {
        let message = '@http get /path'
        t.equal(err.statusCode, 403, 'Errors with 403')
        t.match(err.body, new RegExp(message), `Errors with message instructing to add '${message}' handler`)
      }
      else t.end(result)
    })
  })

  t.test(`[Catchall / ${runType}] get /get-c (matches at root of catchall with trailing slash)`, t => {
    t.plan(3)
    let path = '/get-c/'
    tiny.get({
      url: url + path
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        let { message, pathParameters, rawPath } = result.body
        t.equal(rawPath, path, `got ${rawPath}`)
        t.equal(pathParameters.proxy, '', 'Got correct proxy pathParameters')
        t.equal(message, 'Hello from get /get-c/*', 'Got correct handler response')
      }
    })
  })

  t.test(`[Catchall / ${runType}] get /get-c (matches with one child path part)`, t => {
    t.plan(3)
    let path = '/get-c/hi'
    tiny.get({
      url: url + path
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        let { message, pathParameters, rawPath } = result.body
        t.equal(rawPath, path, `got ${rawPath}`)
        t.equal(pathParameters.proxy, 'hi', 'Got correct proxy pathParameters')
        t.equal(message, 'Hello from get /get-c/*', 'Got correct handler response')
      }
    })
  })

  t.test(`[Catchall / ${runType}] get /get-c (matches with one child path part, trailing slash)`, t => {
    t.plan(3)
    let path = '/get-c/hi/'
    tiny.get({
      url: url + path
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        let { message, pathParameters, rawPath } = result.body
        t.equal(rawPath, path, `got ${rawPath}`)
        t.equal(pathParameters.proxy, 'hi/', 'Got correct proxy pathParameters')
        t.equal(message, 'Hello from get /get-c/*', 'Got correct handler response')
      }
    })
  })

  t.test(`[Catchall / ${runType}] get /get-c (matches with multiple child path parts)`, t => {
    t.plan(3)
    let path = '/get-c/hi/there/wonderful/person'
    tiny.get({
      url: url + path
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        let { message, pathParameters, rawPath } = result.body
        t.equal(rawPath, path, `got ${rawPath}`)
        t.equal(pathParameters.proxy, 'hi/there/wonderful/person', 'Got correct proxy pathParameters')
        t.equal(message, 'Hello from get /get-c/*', 'Got correct handler response')
      }
    })
  })

  // Maybe not strictly an HTTP test but let's check it out anyway
  t.test(`[Timeout / ${runType}] get /times-out`, t => {
    t.plan(3)
    tiny.get({
      url: url + '/times-out'
    }, function _got (err, result) {
      if (err) {
        let message = 'Timeout error'
        let time = '1 second'
        t.equal(err.statusCode, 500, 'Errors with 500')
        t.match(err.body, new RegExp(message), `Errors with message: '${message}'`)
        t.match(err.body, new RegExp(time), `Timed out set to ${time}`)
      }
      else t.end(result)
    })
  })

  t.test(`[context.getRemainingTimeInMillis() / ${runType}] get /context-remaining-ms-node-cjs`, t => {
    t.plan(1)
    tiny.get({
      url: url + '/context-remaining-ms-node-cjs'
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        let { remaining } = result.body
        // Would you believe that Windows, being Windows, actually sometimes calculates >5s remaining on a 5s timeout? You can't make this stuff up.
        t.ok(remaining > 0 && remaining <= 6000, `Got remaining time in milliseconds from context method: ${remaining}`)
      }
    })
  })

  t.test(`[context.getRemainingTimeInMillis() / ${runType}] get /context-remaining-ms-node-esm`, t => {
    t.plan(1)
    tiny.get({
      url: url + '/context-remaining-ms-node-esm'
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        let { remaining } = result.body
        // Would you believe that Windows, being Windows, actually sometimes calculates >5s remaining on a 5s timeout? You can't make this stuff up.
        t.ok(remaining > 0 && remaining <= 6000, `Got remaining time in milliseconds from context method: ${remaining}`)
      }
    })
  })

  t.test(`[Big, but not oversized response / ${runType}] get /big`, t => {
    t.plan(1)
    tiny.get({
      url: url + '/big'
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        let validSize = (1000 * 999 * 6) + 1
        let body = '.'.repeat(validSize)
        t.equal(body, result.body, 'Did not fail on a very large request')
      }
    })
  })

  t.test(`[Big, but not oversized response / ${runType}] get /big-unicode`, t => {
    t.plan(1)
    tiny.get({
      url: url + '/big-unicode'
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        // Sizes are a bit less predictable when generating random unicode, so we'll be a bit conservative with the estimations and see if anything breaks
        let big = 1000 * 750 * 6
        t.ok(Buffer.byteLength(JSON.stringify(result.body)) > big, 'Did not fail on a very large response')
      }
    })
  })

  t.test(`[Oversized response / ${runType}] get /chonky`, t => {
    t.plan(2)
    tiny.get({
      url: url + '/chonky'
    }, function _got (err, result) {
      if (err) {
        let message = 'Invalid payload size'
        t.equal(err.statusCode, 502, 'Errors with 502')
        t.match(err.body, new RegExp(message), `Errors with message: '${message}'`)
      }
      else t.end(result)
    })
  })

  t.test(`[Big, but not oversized request / ${runType}] post /big`, t => {
    t.plan(1)
    let validSize = (1000 * 999 * 6) + 1
    let body = { text: '.'.repeat(validSize) }
    tiny.post({
      url: url + '/big',
      body
    }, function _got (err, result) {
      if (err) t.end(err)
      else t.deepEqual(body, result.body, 'Did not fail on a very large request')
    })
  })

  t.test(`[Oversized request / ${runType}] post /big`, t => {
    t.plan(2)
    let validSize = (1000 * 1000 * 6) + 1
    let body = { text: '.'.repeat(validSize) }
    tiny.post({
      url: url + '/big',
      body
    }, function _got (err, result) {
      if (err) {
        let message = 'Maximum event body exceeded'
        t.equal(err.statusCode, 502, 'Errors with 502')
        t.match(err.body, new RegExp(message), `Errors with message: '${message}'`)
      }
      else t.end(result)
    })
  })

  t.test(`[_static / ${runType}] get /_static (sends static asset)`, t => {
    t.plan(2)
    let path = '/_static/hi.txt'
    tiny.get({
      url: url + path
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        let { body, headers } = result
        t.match(body, /hello from public!/, 'Got back static asset (text file)')
        t.match(headers['content-type'], /text\/plain/, 'Asset is correct content type')
      }
    })
  })

  t.test(`[_static / ${runType}] get /_static (file is missing)`, t => {
    t.plan(3)
    let path = '/_static/foo/hi.json'
    tiny.get({
      url: url + path
    }, function _got (err) {
      if (err) {
        let { body, statusCode } = err
        t.match(body, /NoSuchKey/, 'Got back NoSuchKey error')
        t.match(body, /foo[\/\\]hi.json/, 'Got back filename')
        t.equal(statusCode, 404, 'Got back 404')
      }
      else t.end('Expected 404')
    })
  })

  t.test(`[Misc / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  t.test(`[Misc / ${runType}] Start Sandbox`, t => {
    startup[runType](t, 'static-prefix')
  })

  t.test(`[_static prefix / ${runType}] get /_static with correct prefix (sends static asset)`, t => {
    t.plan(2)
    let path = '/_static/foo/hi.txt'
    tiny.get({
      url: url + path
    }, function _got (err, result) {
      if (err) t.end(err)
      else {
        let { body, headers } = result
        t.match(body, /hello from public!/, 'Got back static asset (text file)')
        t.match(headers['content-type'], /text\/plain/, 'Asset is correct content type')
      }
    })
  })

  t.test(`[_static / ${runType}] get /_static without prefix fails`, t => {
    t.plan(3)
    let path = '/_static/hi.txt'
    tiny.get({
      url: url + path
    }, function _got (err) {
      if (err) {
        let { body, statusCode } = err
        t.match(body, /NoSuchKey/, 'Got back NoSuchKey error')
        t.match(body, /_static[\/\\]hi.txt/, 'Got back filename')
        t.equal(statusCode, 404, 'Got back 404')
      }
      else t.end('Expected 404')
    })
  })

  t.test(`[Misc / ${runType}] Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  // Windows doesn't ship with `du`, so we'll just assume the vendored code runs properly
  let isWin = process.platform.startsWith('win')
  if (!isWin) {
    t.test(`[Misc / ${runType}] Start Sandbox`, t => {
      startup[runType](t, 'coldstart')
    })

    t.test(`[Misc / ${runType}] Set up coldstart chonkyboi`, t => {
      t.plan(1)
      let file = join(process.cwd(), 'test', 'mock', 'coldstart', 'src', 'http', 'get-chonk', 'chonky.txt')
      let MB = 1024 * 1024
      let size = MB * 115
      if (existsSync(file)) t.equal(statSync(file).size, size, 'Found coldstart enchonkinator')
      else {
        let start = Date.now()
        writeFileSync(file, Buffer.alloc(size))
        console.log(`Wrote enchonkinator to Lambda in ${Date.now() - start}ms`)
        t.equal(statSync(file).size, size, 'Found coldstart enchonkinator')
      }
    })

    t.test(`[Misc / ${runType}] No coldstart timeout`, t => {
      t.plan(1)
      tiny.get({
        url: url + '/smol'
      }, function _got (err, result) {
        if (err) t.end(err)
        else t.deepEqual(result.body, { ok: true }, 'Lambda did not timeout from a coldstart')
      })
    })

    t.test(`[Misc / ${runType}] Coldstart timeout`, t => {
      t.plan(3)
      tiny.get({
        url: url + '/chonk'
      }, function _got (err, result) {
        if (err) {
          let message = 'Timeout error'
          let time = '1 second'
          t.equal(err.statusCode, 500, 'Errors with 500')
          t.match(err.body, new RegExp(message), `Errors with message: '${message}'`)
          t.match(err.body, new RegExp(time), `Timed out set to ${time}`)
        }
        else t.end(result)
      })
    })

    t.test(`[Misc / ${runType}] Shut down Sandbox`, t => {
      shutdown[runType](t)
    })
  }
}
