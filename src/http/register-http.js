let exists = require('fs').existsSync
let join = require('path').join
let utils = require('@architect/utils')
let log = require('./pretty-print-route')
let invoker = require('./invoke-http')
let name = utils.getLambdaName
let updater = utils.updater

module.exports = function reg (app, api, type, routes) {
  let quiet = process.env.QUIET
  if (!quiet) {
    let update = updater('Sandbox')
    update.done('Loaded routes')
  }

  // adds default get / aka 'proxy at root'
  let hasGetIndex = routes.some(tuple => tuple[0].toLowerCase() === 'get' && tuple[1] === '/')
  let deprecated = process.env.DEPRECATED
  if (!hasGetIndex && !deprecated) {
    // Sandbox running as a dependency (most common use case)
    let arcProxy = join(process.cwd(), 'node_modules', '@architect', 'http-proxy', 'dist')
    // Sandbox running as a global install
    let global = join(__dirname, '..', '..', '..', 'http-proxy', 'dist')
    // Sandbox running from a local (symlink) context (usually testing/dev)
    let local = join(__dirname, '..', '..', 'node_modules', '@architect', 'http-proxy', 'dist')
    if (exists(global)) arcProxy = global
    else if (exists(local)) arcProxy = local

    let exec = invoker({
      verb: 'GET',
      pathToFunction: arcProxy
    })
    app.get('/', exec)
  }

  routes.forEach(r => {
    let verb = r[0].toLowerCase()
    let route = r[1]
    let path = name(route)
    let pathToFunction = join(process.cwd(), 'src', type, `${verb}${path}`)

    // pretty print the route reg
    log({ verb, route, path })

    // reg the route with the Router instance
    let exec = invoker({ verb, pathToFunction, route })
    app[verb](route, exec)
  })
}
