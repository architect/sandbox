let { deepFrozenCopy } = require('@architect/utils')
let _invoke = require('../../invoke-lambda/_plugin')
let { userEnvVars } = require('../../lib')
let swapEnvVars = require('./swap-env-vars')

module.exports = function sandboxStartPlugins (params, options, callback) {
  let { inventory, update } = params
  let { method, name } = options
  let { inv } = inventory
  let envVars = userEnvVars(params)
  let { swap, restore } = swapEnvVars(envVars)

  let plugins = inv.plugins?._methods?.sandbox?.[method]
  if (plugins) {
    let start = Date.now()
    swap()
    let plural = plugins.length > 1 ? 's' : ''
    update.status(`Running ${plugins.length} Sandbox ${name} plugin${plural}`)
    let invoke = _invoke.bind({}, params)
    let frozen = deepFrozenCopy(inventory)
    let { arc } = frozen.inv._project
    let args = { arc, inventory: frozen, invoke }
    async function runPlugins () {
      for (let plugin of plugins) {
        await plugin(args)
      }
    }
    runPlugins()
      .then(() => {
        restore()
        let finish = Date.now()
        update.done(`Ran Sandbox ${name} plugin${plural} in ${finish - start}ms`)
        callback()
      })
      .catch(callback)
  }
  else callback()
}
