let join = require('path').join
let utils = require('@architect/utils')
let log = require('./pretty-print-route')
let invoker = require('./invoke-http')
let name = utils.getLambdaName

module.exports = function reg(app, api, type, routes) {

  // adds default get / aka 'proxy at root'
  let hasGetIndex = routes.some(tuple=> tuple[0].toLowerCase() === 'get' && tuple[1] === '/')
  if (!hasGetIndex) {
    // mount the vendored get /
    // IMPORTANT this needs to be a closure.. to ensure this function only gets called ONCE
    let exec = invoker({
      verb: 'get',
      pathToFunction: join(__dirname, '..', '..', 'vendor', 'arc-proxy-3.2.3')
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
    let exec = invoker({verb, pathToFunction})
    app[verb](route, exec)
  })
}
