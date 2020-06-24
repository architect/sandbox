let invoke = require('../../invoke-lambda')
let requestFormatter = require('./_req-fmt')
let requestFormatterDeprecated = require('./_req-fmt-deprecated')
let responseFormatter = require('./_res-fmt')
let responseFormatterDeprecated = require('./_res-fmt-deprecated')
let validator = require('./_validator')

/**
 * Formats and validates HTTP request and response event objects
 */
module.exports = function invokeHTTP ({ verb, pathToFunction, route }) {
  if (verb) verb = verb.toUpperCase()
  let deprecated = process.env.DEPRECATED

  return function respond (req, res) {

    // Coerce API Gateway 'Cookie' from express 'cookie'
    req.headers.Cookie = req.headers.cookie
    delete req.headers.cookie
    if (!req.headers.Cookie) delete req.headers.Cookie

    // Set up request shape
    let request = deprecated
      ? requestFormatterDeprecated({ verb, req })
      : requestFormatter({ verb, req, route })

    // run the lambda sig locally
    invoke(pathToFunction, request, function _res (err, result) {
      if (err) res.end(err.message)
      else {
        let { valid, body } = validator({ res, result })
        if (!valid) {
          res.end(body)
        }
        else {
          let body = deprecated
            ? responseFormatterDeprecated({ res, result })
            : responseFormatter({ res, result })
          res.end(body || '')
        }
      }
    })
  }
}
