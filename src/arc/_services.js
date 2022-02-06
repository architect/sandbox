module.exports = function enumerateServices (params, callback) {
  let { inventory } = params
  let { inv } = inventory
  let { app } = inv
  let services = {}

  // Tables
  if (inv.tables) {
    services.tables = {}
    inv.tables.forEach(({ name }) => {
      // 'staging' env is just for legacy local compatibility
      // See: tables/create-table
      services.tables[name] = `${app}-staging-${name}`
    })
  }

  // Plugins
  let servicesPlugins = inv.plugins?._methods?.deploy?.services
  if (servicesPlugins) {
    let { arc } = inv._project
    async function runPlugins () {
      for (let plugin of servicesPlugins) {
        let name = plugin.plugin
        if (!services[name]) services[name] = {}
        let result = await plugin({ arc, cloudformation: null, inventory, stage: 'testing' })
        if (result && Object.keys(result).length) {
          Object.entries(result).forEach(([ k, v ]) => {
            services[name][k] = v
          })
        }
      }
    }
    runPlugins()
      .then(() => callback(null, services))
      .catch(callback)
  }
  else callback(null, services)
}
