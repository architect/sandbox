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

    invoke({ lambda, event: payload, ...params }, function snap (err) {
      if (err?.message === 'lambda_not_found') {
        update.warn(
          `Plugin invoke: @${pragma} ${name} missing Lambda handler file\n` +
          `Please create a handler file, or run [npx] arc init, or add 'autocreate true' to your project preferences file's '@create' pragma`
        )
      }
      else if (err) {
        update.err(`Plugin invoked @${pragma} ${name}, failed with ${err.stack}`)
      }
      else {
        update.status(`Plugin invoked @${pragma} ${name}`)
      }
      res()
    })
  })
}
