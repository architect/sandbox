let invoke = require('../../invoke-lambda')
let requestFormatter = require('./rest/_req-fmt')
let requestFormatterDeprecated = require('./deprecated/_req-fmt')
let responseFormatter = require('./rest/_res-fmt')
let responseFormatterDeprecated = require('./deprecated/_res-fmt')
let validator = require('./_validator')

/**
 * Formats and validates HTTP request and response event objects
 */
module.exports = function invokeHTTP ({ verb, pathToFunction, route }) {
  if (verb) verb = verb.toUpperCase()
  let deprecated = process.env.DEPRECATED

  return function respond (req, res) {
    // Set up request shape
    let request = deprecated
      ? requestFormatterDeprecated({ verb, req })
      : requestFormatter({ verb, req, route })

    // Run the lambda sig locally
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
