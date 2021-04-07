let read = require('@architect/inventory/src/read')
let defaultFunctionConfig = require('@architect/inventory/src/defaults/function-config')
let invocator = require('./src/invoke-lambda')

module.exports = function invokeLambda ({ inventory, src, payload }, callback) {
  let params = {
    lambda: {
      src,
      config: getFunctionConfig(src),
      _proxy: true // short circuits sandbox's lambda invocation handler check
    },
    event: payload,
    inventory
  }
  invocator(params, callback)
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

