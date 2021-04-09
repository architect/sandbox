module.exports = function servicePopulator (inventory) {
  let { inv } = inventory
  if (!inv._serviceDiscovery) {
    let app = inv.app
    let services = {
      tables: {}
    }
    if (inv.tables) {
      inv.tables.forEach(({ name }) => {
        // 'staging' env is just for legacy local compatibility
        // See: tables/create-table
        services.tables[name] = `${app}-staging-${name}`
      })
    }
    if (inv._project.plugins) {
      const plugins = Object.keys(inv._project.plugins)
      plugins.forEach(pluginName => {
        const pluginModule = inv._project.plugins[pluginName]
        if (pluginModule && pluginModule.variables) {
          const pluginVars = pluginModule.variables({ arc: inv._project.arc, stage: 'testing', inventory })
          services[pluginName] = pluginVars
        }
      })
    }
    inv._serviceDiscovery = services
  }
}
