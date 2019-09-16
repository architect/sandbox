let chalk = require('chalk')
let join = require('path').join
let utils = require('@architect/utils')
let chars = utils.chars
let log = require('./pretty-print-route')
let invoker = require('./invoke-http')
let name = utils.getLambdaName
let quiet = process.env.QUIET

module.exports = function reg(app, api, type, routes) {
  if (!quiet) {
    let msg = chalk.grey(chars.done, 'Loaded routes:')
    console.log(`${msg}`)
  }

  // adds default get / aka 'proxy at root'
  let hasGetIndex = routes.some(tuple=> tuple[0].toLowerCase() === 'get' && tuple[1] === '/')
  if (!hasGetIndex) {
    // mount the vendored get /
    // IMPORTANT this needs to be a closure to ensure this function only gets called ONCE
    let exec = invoker({
      verb: 'GET',
      pathToFunction: join(process.cwd(), 'node_modules', '@architect', 'http-proxy', 'dist')
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
