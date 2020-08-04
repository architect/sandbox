let invoke = require('../../invoke-lambda')

// REST APIs
let requestFormatterDeprecated = require('./deprecated/_req-fmt')
let requestFormatterRest = require('./rest/_req-fmt')
let responseFormatterDeprecated = require('./deprecated/_res-fmt')
let responseFormatterRest = require('./rest/_res-fmt')
let responseValidatorRest = require('./rest/_res-validate')

// HTTP APIs
let requestFormatterHttp = require('./http/_req-fmt')
let responseFormatterHttp = require('./http/_res-fmt')
let responseValidatorHttp = require('./http/_res-validate')

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
    let request
    if (deprecated) {
      request = requestFormatterDeprecated({ verb, req })
    }
    else if (restApi || httpApiV1) {
      request = requestFormatterRest({ verb, route, req }, httpApiV1)
    }
    else {
      request = requestFormatterHttp({ verb, route, req, $default })
    }

    // Run the Lambda sig locally
    invoke(pathToFunction, request, function _res (err, result) {
      if (err) res.end(err.message)
      else {
        // Totally separate out response validation paths to ensure type checks don't inadvertently blow everything up
        let resty = deprecated || restApi || httpApiV1
        if (resty) {
          let { body, valid } = responseValidatorRest({ res, result }, httpApiV1)
          if (!valid) {
            res.end(body)
          }
          else {
            let body
            if (deprecated) {
              body = responseFormatterDeprecated({ res, result })
            }
            else if (restApi || httpApiV1) {
              body = responseFormatterRest({ res, result }, httpApiV1)
            }
            res.end(body || '')
          }
        }
        else {
          let { body, valid } = responseValidatorHttp({ res, result })
          if (!valid) {
            res.end(body)
          }
          else {
            let body = responseFormatterHttp({ res, result })
            res.end(body || '')
          }
        }
      }
    })
  }
}
