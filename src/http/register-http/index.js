let invoker = require('../invoke-http')

module.exports = function reg (app, params) {
  let { apiType, inventory, restart, update } = params

  inventory.inv.http.forEach(lambda => {
    // ASAP handled by middleware
    if (lambda.arcStaticAssetProxy) return
    let { method, path } = lambda

    // Methods not implemented by Arc for legacy REST APIs
    if (apiType === 'rest') {
      let httpOnly = [ 'any', 'head', 'options' ]
      let hasCatchall = path.includes('*')
      if (!httpOnly.includes(method) && !hasCatchall) {
        let exec = invoker({ lambda, ...params })
        app[method](path, exec)
      }
    }
    else {
      // Register the route with the Router instance
      let exec = invoker({ lambda, ...params })
      if (method !== 'any') {
        app[method](path, exec)
      }
      // In the case of `any`, register all methods
      else {
        let methods = [ 'get', 'post', 'put', 'patch', 'head', 'delete', 'options' ]
        for (let method of methods) {
          app[method](path, exec)
        }
      }
    }
  })

  if (!restart) update.done(`@http server started`)
}
