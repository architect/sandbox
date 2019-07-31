let chalk = require('chalk')
let join = require('path').join
let utils = require('@architect/utils')
let log = require('./pretty-print-route')
let invoker = require('./invoke-http')
let name = utils.getLambdaName
let chars = utils.chars

module.exports = function reg(app, api, type, routes) {

  // adds default get / aka 'proxy at root'
  let hasGetIndex = routes.some(tuple=> tuple[0].toLowerCase() === 'get' && tuple[1] === '/')
  if (!hasGetIndex) {
    // mount the vendored get /
    app.get('/', invoker({
      verb: 'get', 
      pathToFunction: join(__dirname, '..', '..', 'vendor', 'arc-proxy-3.2.2')
    }))
  }

  routes.forEach(r=> {

    let verb = r[0].toLowerCase()
    let route = r[1]
    let path = name(route)
    let pathToFunction = join(process.cwd(), 'src', type, `${verb}${path}`)

    // pretty print the route reg
    log({verb, route, path})

    // reg the route with the Router instance
    let exec = invoker({verb, pathToFunction})
    app[verb](route, exec)
  })
}
