let { join } = require('path')
let { getLambdaName: name, updater } = require('@architect/utils')
let log = require('./pretty-print-route')
let invoker = require('../invoke-http')

module.exports = function reg (app, api, type, routes) {
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

  routes.forEach(r => {
    let method = r[0].toLowerCase()
    let route = r[1]
    let path = name(route)
    let pathToFunction = join(process.cwd(), 'src', type, `${method}${path}`)

    // pretty print the route reg
    log({ method, route, path })

    // reg the route with the Router instance
    let exec = invoker({ method, pathToFunction, route, apiType })
    app[method](route, exec)
  })
}
