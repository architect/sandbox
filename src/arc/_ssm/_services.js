module.exports = function servicePopulator (inventory) {
  let { inv } = inventory
  let { app } = inv
  let services = {}

  // TODO add @events, @queues, @static, bucket param population
  if (inv.tables) {
    services.tables = {}
    inv.tables.forEach(({ name }) => {
      // 'staging' env is just for legacy local compatibility
      // See: tables/create-table
      services.tables[name] = `${app}-staging-${name}`
    })
  }
  // TODO fix plugin service discovery
  /* if (inv._project.plugins) {
    let plugins = Object.keys(inv._project.plugins)
    plugins.forEach(pluginName => {
      let pluginModule = inv._project.plugins[pluginName]
      if (pluginModule?.variables) {
        let pluginVars = pluginModule.variables({ arc: inv._project.arc, stage: 'testing', inventory })
        services[pluginName] = pluginVars
      }
    })
  } */
  return services
}
