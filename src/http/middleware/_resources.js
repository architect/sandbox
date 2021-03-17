/**
 * Architect resource discovery internal endpoint
 */
module.exports = function _ard ({ inv }, req, res, next) {
  if (req.method.toLowerCase() === 'get' && req.url === '/_ard') {
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
    // TODO add more services!

    res.statusCode = 200
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(services, null, 2))
  }
  else {
    next()
  }
}
