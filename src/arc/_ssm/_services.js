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
    inv._serviceDiscovery = services
  }
}
