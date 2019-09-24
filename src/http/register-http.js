let exists = require('fs').existsSync
let join = require('path').join
let utils = require('@architect/utils')
let log = require('./pretty-print-route')
let invoker = require('./invoke-http')
let name = utils.getLambdaName
let updater = utils.updater
let quiet = process.env.QUIET

module.exports = function reg(app, api, type, routes) {
  if (!quiet) {
    let update = updater('Sandbox')
    update.done('Loaded routes:')
  }

  // adds default get / aka 'proxy at root'
  let hasGetIndex = routes.some(tuple=> tuple[0].toLowerCase() === 'get' && tuple[1] === '/')
  if (!hasGetIndex) {
    // mount the vendored get /
    // IMPORTANT this needs to be a closure to ensure this function only gets called ONCE
    let arcProxy = join(process.cwd(), 'node_modules', '@architect', 'http-proxy', 'dist')
    let local = join(__dirname, '..', '..', 'node_modules', '@architect', 'http-proxy', 'dist')
    // Check to see if sandbox is being called from a local (symlink) context
    if (exists(local)) arcProxy = local
    let exec = invoker({
      verb: 'GET',
      pathToFunction: arcProxy
    })
    app.get('/', exec)
  }

  routes.forEach(r=> {
    let verb = r[0].toLowerCase()
    let route = r[1]
    let path = name(route)
    let pathToFunction = join(process.cwd(), 'src', type, `${verb}${path}`)

    // pretty print the route reg
    log({verb, route, path})

    // reg the route with the Router instance
    let exec = invoker({verb, pathToFunction, route})
    app[verb](route, exec)
  })
}
