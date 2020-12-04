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

// Etc.
let invoke = require('../../invoke-lambda')
let { errors, invalid } = require('./utils/validate')

/**
 * Formats and validates HTTP request and response event objects
 */
module.exports = function invokeHTTP (params) {
  let { lambda, apiType } = params
  let { method, path } = lambda

  method = method.toUpperCase()
  let deprecated = process.env.DEPRECATED
  let restApi = apiType === 'rest'
  let httpApiV1 = apiType === 'httpv1'

  return function respond (req, res) {
    let request
    if (deprecated) {
      request = requestFormatterDeprecated({ method, req })
    }
    else if (httpApiV1 || restApi) {
      request = requestFormatterRest({ method, path, req }, httpApiV1)
    }
    else {
      request = requestFormatterHttp({ method, path, req })
    }

    // Run the Lambda sig locally
    invoke(lambda, request, function _res (err, result) {
      if (err && err.message === 'lambda_not_found') {
        let body = errors.notFound(lambda)
        invalid(res, body)
        res.end(body)
      }
      else if (err) {
        let body = errors.other('Unknown error', err.message)
        invalid(res, body)
        res.end(body)
      }
      else {
        // Totally separate out response validation paths to ensure type checks don't inadvertently blow everything up
        let resty = deprecated || restApi || httpApiV1
        if (resty) {
          let { body, valid } = responseValidatorRest({ res, result }, httpApiV1)
          if (!valid) {
            end(res, body)
          }
          else {
            let body
            if (deprecated) {
              body = responseFormatterDeprecated({ res, result })
            }
            else {
              body = responseFormatterRest({ res, result }, httpApiV1)
            }
            end(res, body)
          }
        }
        else {
          let { body, valid } = responseValidatorHttp({ res, result })
          if (!valid) {
            end(res, body)
          }
          else {
            let body = responseFormatterHttp({ res, result })
            end(res, body)
          }
        }
      }
    })
  }
}

function end (res, body = '') {
  let MB = 1000 * 1000
  let itBeChonky = 6 * MB // Max Lambda payload size
  if (body.length > itBeChonky) {
    let size = `${(body.length / MB).toFixed(2).toLocaleString()}MB (${body.length.toLocaleString()}b) `
    body = errors.chonky(size)
    invalid(res, body)
    res.end(body)
  }
  else res.end(body)
}
