let { updater } = require('@architect/utils')
let log = require('./pretty-print-route')
let invoker = require('../invoke-http')

module.exports = function reg ({ app, routes }) {
  let apiType = process.env.ARC_API_TYPE
  let deprecated = process.env.DEPRECATED
  let msgs = {
    deprecated: 'REST API mode / Lambda integration',
    rest: 'REST API mode / Lambda proxy',
    http: 'HTTP API mode / Lambda proxy v2.0 format',
    httpv2: 'HTTP API mode / Lambda proxy v2.0 format',
    httpv1: 'HTTP API mode / Lambda proxy v1.0 format',
  }
  let msg = deprecated ? msgs.deprecated : msgs[apiType]
  let update = updater('Sandbox')
  update.done(`Loaded routes (${msg})`)

  routes.forEach(lambda => {
    // ASAP handled by middleware
    if (lambda.arcStaticAssetProxy) return
    let { method, path, src } = lambda

    // Methods not implemented by Arc for legacy REST APIs
    if (deprecated || apiType === 'rest') {
      let httpOnly = [ 'any', 'head', 'options' ]
      let hasCatchall = path.includes('*')
      if (!httpOnly.some(h => h === method) && !hasCatchall) {
        // Pretty print the route reg
        log({ method, path, src })
        // Register the route with the Router instance
        let exec = invoker({ lambda, apiType })
        app[method](path, exec)
      }
    }
    else {
      // Pretty print the route reg
      log({ method, path, src })

      // Register the route with the Router instance
      let exec = invoker({ lambda, apiType })
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
}
