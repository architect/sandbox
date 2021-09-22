let read = require('@architect/inventory/src/read')
let defaultFunctionConfig = require('@architect/inventory/src/defaults/function-config')
let invoker = require('./')

module.exports = function invokePluginFunction (params, { src, payload }, callback) {
  invoker({
    event: payload,
    lambda: {
      src,
      config: getFunctionConfig(src),
      _skipHandlerCheck: true // short circuits Lambda invocation handler check
    },
    ...params,
  }, callback)
}

// compile any per-function config.arc customizations
function getFunctionConfig (dir) {
  let defaults = defaultFunctionConfig()
  let customizations = read({ type: 'functionConfig', cwd: dir }).arc.aws
  let overrides = {}
  for (let config of customizations) {
    overrides[config[0]] = config[1]
  }
  return { ...defaults, ...overrides }
}
