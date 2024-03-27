let invoke = require('./')

module.exports = async function _invoke (params, options) {
  return new Promise((res, rej) => {
    let { update } = params
    let { get } = params.inventory
    let { pragma, name, payload } = options
    if (!pragma) return rej(ReferenceError('Cannot invoke Lambda, missing pragma'))
    if (!name) return rej(ReferenceError('Cannot invoke Lambda, missing name'))
    if (!payload) return rej(ReferenceError('Cannot invoke Lambda, missing payload'))

    let lambda = get[pragma](name)
    if (!lambda) return rej(ReferenceError(`Cannot find Lambda to invoke: @${pragma} ${name}`))

    function reconstructError (payload) {
      let { errorType, errorMessage, stackTrace } = payload
      let reconstructedError = Error()
      if (errorType) reconstructedError.name = errorType
      if (errorMessage) reconstructedError.message = errorMessage
      if (stackTrace) reconstructedError.stack = stackTrace.join('\n')
      return reconstructedError
    }

    invoke({ lambda, event: payload, ...params }, function (err, response, error, initError) {
      // System errors
      if (err?.message === 'lambda_not_found') {
        let msg = `Plugin invoke: @${pragma} ${name} missing Lambda handler file`
        update.warn(
          `${msg}\n` +
          `Please create a handler file, or run [npx] arc init, or add 'autocreate true' to your project preferences file's '@create' pragma`,
        )
        err.message = msg
        return rej(err)
      }
      else if (err) {
        let msg = `Plugin invoked @${pragma} ${name}, failed with ${err.stack}`
        update.err(msg)
        return rej(err)
      }
      update.status(`Plugin invoked @${pragma} ${name}`)

      // Userland code errors
      if (error || initError) {
        return rej(reconstructError(error || initError))
      }
      res(response)
    })
  })
}
