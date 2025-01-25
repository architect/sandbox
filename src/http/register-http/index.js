let invoker = require('../invoke-http')

module.exports = function reg (app, params) {
  let { apiType, inventory, restart, update } = params

  inventory.inv.http.forEach(lambda => {
    // ASAP handled by middleware
    if (lambda.arcStaticAssetProxy) return
    let { method, path } = lambda

    // Router 2 introduced some important changes to wildcard behavior
    // Taking the following example Arc route: `get /foo/*`:
    // - Previously, trailing wildcards would return a param named `0` with the remaining path as a string, e.g. `{ '0': 'bar' }`
    // - Now, wildcards must be named (and have thusly been internally renamed to `/*_arc_catchall`), and return a named property as an array, e.g. : `/foo/*_arc_catchall` becomes `{ '_arc_catchall': [ 'bar' ] }`
    // - Previously, trailing slashes would match the wildcard level, and return the normal `0` property as an empty string, e.g. `get /foo/` returns `{ '0': '' }`
    // - Now, trailing slashes no longer match at the wildcard level (via changes to path-to-regexp), and thus must have their own special aliased path (see: `catchallTrailingSlash`)
    let hasCatchall = path.endsWith('/*')
    if (hasCatchall) {
      path = path += '_arc_catchall'
    }

    // Methods not implemented by Arc for legacy REST APIs
    if (apiType === 'rest') {
      let httpOnly = [ 'any', 'head', 'options' ]
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
        if (path.endsWith('/*_arc_catchall')) {
          let trailingSlashCatchall = path.replace('*_arc_catchall', '')
          let exec = invoker({ lambda, ...params, catchallTrailingSlash: true })
          app[method](trailingSlashCatchall, exec)
        }
      }
      // In the case of `any`, register all methods
      else {
        let methods = [ 'get', 'post', 'put', 'patch', 'head', 'delete', 'options' ]
        for (let method of methods) {
          app[method](path, exec)
          if (path.endsWith('/*_arc_catchall')) {
            let trailingSlashCatchall = path.replace('*_arc_catchall', '')
            let exec = invoker({ lambda, ...params, catchallTrailingSlash: true })
            app[method](trailingSlashCatchall, exec)
          }
        }
      }
    }
  })

  if (!restart) update.verbose.done(`@http server started`)
}
