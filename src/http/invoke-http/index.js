let invoke = require('../../invoke-lambda')
let validator = require('./_validator')
// Request formatters
let requestFormatterDeprecated = require('./deprecated/_req-fmt')
let requestFormatterRest = require('./rest/_req-fmt')
let requestFormatterHttp = require('./http/_req-fmt')
// Response formatters
let responseFormatterDeprecated = require('./deprecated/_res-fmt')
let responseFormatterRest = require('./rest/_res-fmt')
// let responseFormatterHttp = require('./http/_res-fmt')

/**
 * Formats and validates HTTP request and response event objects
 */
module.exports = function invokeHTTP (params) {
  let { verb, pathToFunction, route, apiType, $default } = params

  if (verb) verb = verb.toUpperCase()
  let deprecated = process.env.DEPRECATED
  let restApi = apiType === 'rest'
  let httpApiV1 = apiType === 'httpv1'

  return function respond (req, res) {
    // Set up request shape
    let request

    if (deprecated) {
      request = requestFormatterDeprecated({ verb, req })
    }
    else if (restApi) {
      request = requestFormatterRest({ verb, route, req })
    }
    else if (httpApiV1) {
      request = requestFormatterRest({ verb, route, req }, true)
    }
    else {
      request = requestFormatterHttp({ verb, route, req, $default })
    }

    // Run the lambda sig locally
    invoke(pathToFunction, request, function _res (err, result) {
      if (err) res.end(err.message)
      else {
        let { valid, body } = validator({ res, result })
        if (!valid) {
          res.end(body)
        }
        else {
          let body
          if (deprecated) {
            body = responseFormatterDeprecated({ res, result })
          }
          else if (restApi || httpApiV1) {
            body = responseFormatterRest({ res, result })
          }
          else {
            body = responseFormatterRest({ res, result })
          }
          // else {
          //  body = responseFormatterHttp({ res, result })
          // }
          res.end(body || '')
        }
      }
    })
  }
}
