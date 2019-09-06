let readArc = require('@architect/utils/read-arc')
let path = require('path')
let {parse} = require('url')
let invoker = require('./invoke-http')

/**
 * serves static assets found in /public
 * - if /public/index.html exists it will serve it as /
 *   (even if `get /` http lambda is defined)
 */
module.exports = function _public(req, res, next) {
  // immediately exit to normal flow if /
  if (req.path === '/') next()
  else {
    let arc = readArc().arc
    // reads all routes
    let routes = arc.http || []
    // add websocket route if necessary
    if (arc.ws) routes.push(['post', '/__arc'])
    // tokenize them [['get', '/']]
    let tokens = routes.map(r=> [r[0]].concat(r[1].split('/').filter(Boolean)))
    // tokenize the current req
    let {pathname} = parse(req.url)
    let current = [req.method.toLowerCase()].concat(pathname.split('/').filter(Boolean))
    // get all exact match routes
    let exact = tokens.filter(t=> !t.some(v=> v.startsWith(':')))
    // get all wildcard routes
    let wild = tokens.filter(t=> t.some(v=> v.startsWith(':')))

    // look for an exact match
    let exactMatch = exact.some(t=> t.join('') === current.join(''))

    // look for a wildcard match
    let wildMatch = wild.filter(t=> t.length === current.length).some(t=> {
      // turn :foo tokens into (\S+) regexp
      let exp = t.map(p=> p.startsWith(':')? '(\\S+)' : p).join('/')
      let reg = new RegExp(exp)
      return reg.test(current.join('/'))
    })

    // check to see if we are using the vendored proxy
    let findGetIndex = tuple=> tuple[0].toLowerCase() === 'get' && tuple[1] === '/'
    let proxyAtRoot = (!arc.http) || (arc.http && !arc.http.some(findGetIndex))

    // if either exact or wildcard match bail
    let match = exactMatch || wildMatch
    if (match) {
      next()
    }
    else if (proxyAtRoot) {
      let exec = invoker({
        verb: 'GET',
        pathToFunction: path.join(__dirname, '..', '..', 'vendor', 'arc-proxy-3.3.7')
      })
      req.requestContext = {}
      exec(req, res)
    }
    else {
      // invoke the get-index lambda function with a proxy payload
      let exec = invoker({
        verb: req.method.toLowerCase(),
        pathToFunction: path.join(process.cwd(), 'src', 'http', `get-index`)
      })
      // TODO mock a {proxy+} request payload
      req.requestContext = {}
      exec(req, res)
    }
  }
}
