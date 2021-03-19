/**
 * Architect service discovery internal endpoint
 */
module.exports = function _asd (inventory, req, res, next) {
  let { inv } = inventory
  if (req.method.toLowerCase() === 'get' && req.url === '/_asd') {
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
      let pluginNames = Object.keys(inv._project.plugins)
      pluginNames.forEach(pluginName => {
        let pluginModule = inv._project.plugins[pluginName]
        if (pluginModule.variables) {
          let vars = pluginModule.variables({ arc: inv._project.arc, inventory, stage: 'testing' })
          let keys = Object.keys(vars)
          if (keys && keys.length) {
            if (!services[pluginName]) services[pluginName] = {}
            keys.forEach(k => {
              services[pluginName][k] = vars[k]
            })
          }
        }
      })
    }
    // TODO add more services!

    res.statusCode = 200
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(services, null, 2))
  }
  else {
    next()
  }
}
