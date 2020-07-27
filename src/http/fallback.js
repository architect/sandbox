let readArc = require('../sandbox/read-arc')
let exists = require('fs').existsSync
let join = require('path').join
let { parse } = require('url')
let invoker = require('./invoke-http')

/**
 * Emulates REST `/{proxy+}` & HTTP `$default`
 * - Forwards unmatched requests to `get /` (if present)
 * - Otherwise serves static assets found in /public
 */
module.exports = function fallback (req, res, next) {
  // immediately exit to normal flow if /
  if (req.path === '/') next()
  else {
    let { arc } = readArc()
    let apiType = process.env.ARC_API_TYPE
    let deprecated = process.env.DEPRECATED
    let method = req.method.toLowerCase()
    // reads all routes
    let routes = arc.http || []
    // add websocket route if necessary
    if (arc.ws) routes.push([ 'post', '/__arc' ])
    // tokenize them [['get', '/']]
    let tokens = routes.map(r => [ r[0] ].concat(r[1].split('/').filter(Boolean)))
    // tokenize the current req
    let { pathname } = parse(req.url)
    let current = [ method ].concat(pathname.split('/').filter(Boolean))
    // get all exact match routes
    let exact = tokens.filter(t => !t.some(v => v.startsWith(':')))
    // get all wildcard routes
    let wild = tokens.filter(t => t.some(v => v.startsWith(':')))

    // look for an exact match
    let exactMatch = exact.some(t => t.join('') === current.join(''))

    // look for a wildcard match
    let wildMatch = wild.filter(t => t.length === current.length).some(t => {
      // turn :foo tokens into (\S+) regexp
      let exp = t.map(p => p.startsWith(':') ? '(\\S+)' : p).join('/')
      let reg = new RegExp(exp)
      return reg.test(current.join('/'))
    })

    // check to see if we are using the vendored proxy
    let findGetIndex = tuple => tuple[0].toLowerCase() === 'get' && tuple[1] === '/'
    let proxyAtRoot = (!arc.http) || (arc.http && !arc.http.some(findGetIndex))

    // if either exact or wildcard match bail
    let match = exactMatch || wildMatch

    // Arc v5 doesn't support implicit proxy at root, move along
    let invalid = proxyAtRoot && deprecated

    // Determine whether this is a proxy req
    let nonGetRequestToRoot = method !== 'get' && pathname === '/'
    let isProxy = pathname !== '/' || nonGetRequestToRoot

    if (match || invalid) {
      next()
    }
    else if (nonGetRequestToRoot && apiType === 'rest') {
      // /{proxy+} captures all requests not specifically to root
      // However, $default captures all uncaptured requests, so this failure path only applies to REST APIs
      res.statusCode = 403
      res.setHeader('content-type', 'text/html; charset=utf-8;')
      let message = `Endpoint does not exist for ${method} ${pathname}<br>Add <code>@http ${method} ${pathname}</code> to your Architect project manifest (and create an appropriate handler)`
      res.end(message)
    }
    else {
      let pathToFunction = join(process.cwd(), 'src', 'http', `get-index`)
      if (proxyAtRoot && !deprecated) {
        // Sandbox running as a dependency (most common use case)
        pathToFunction = join(process.cwd(), 'node_modules', '@architect', 'http-proxy', 'dist')
        // Sandbox running as a global install
        let global = join(__dirname, '..', '..', '..', 'http-proxy', 'dist')
        // Sandbox running from a local (symlink) context (usually testing/dev)
        let local = join(__dirname, '..', '..', 'node_modules', '@architect', 'http-proxy', 'dist')
        if (exists(global)) pathToFunction = global
        else if (exists(local)) pathToFunction = local
      }

      // Invoke with a proxy / $default payload
      let exec = invoker({
        verb: method,
        pathToFunction,
        apiType,
        $default: true
      })
      if (isProxy) {
        req.resource = '/{proxy+}'
        req.params = { proxy: pathname }
      }
      else req.resource = pathname
      req.requestContext = {} // TODO mock a proxy request payload
      exec(req, res)
    }
  }
}
