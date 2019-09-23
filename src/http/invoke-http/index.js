let invoke = require('../../invoke-lambda')
let requestFormatter = require('./_req-fmt')
let requestFormatterDeprecated = require('./_req-fmt-deprecated')
let responseFormatter = require('./_res-fmt')
let responseFormatterDeprecated = require('./_res-fmt-deprecated')

/**
 * builds response middleware for invoke
 */
module.exports = function invokeHTTP({verb, pathToFunction, route}) {
  if (verb) verb = verb.toUpperCase()
  let deprecated = process.env.DEPRECATED

  return function respond(req, res) {

    // Coerce API Gateway 'Cookie' from express 'cookie'
    req.headers.Cookie = req.headers.cookie
    delete req.headers.cookie
    if (!req.headers.Cookie) delete req.headers.Cookie

    // Set up request shape
    let request
    if (!deprecated) {
      request = requestFormatter({verb, route, req})
    }
    else {
      request = requestFormatterDeprecated({verb, req})
    }

    // run the lambda sig locally
    invoke(pathToFunction, request, function _res(err, result) {
      if (err) res(err)
      else {
        if (!deprecated) {
          let body = responseFormatter({res, result})
          res.end(body || '')
        }
        else {
          let body = responseFormatterDeprecated({res, result})
          res.end(body || '')
        }
      }
    })
  }
}
