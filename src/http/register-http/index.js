let invoker = require('../invoke-http')

module.exports = function reg (params) {
  let { app, cwd, routes, inventory, update } = params

  let apiType = process.env.ARC_API_TYPE
  let deprecated = process.env.DEPRECATED

  routes.forEach(lambda => {
    // ASAP handled by middleware
    if (lambda.arcStaticAssetProxy) return
    let { method, path } = lambda

    // Methods not implemented by Arc for legacy REST APIs
    if (deprecated || apiType === 'rest') {
      let httpOnly = [ 'any', 'head', 'options' ]
      let hasCatchall = path.includes('*')
      if (!httpOnly.some(h => h === method) && !hasCatchall) {
        let exec = invoker({ cwd, lambda, apiType, inventory, update })
        app[method](path, exec)
      }
    }
    else {
      // Register the route with the Router instance
      let exec = invoker({ cwd, lambda, apiType, inventory, update })
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

  update.done(`@http server started`)
}
