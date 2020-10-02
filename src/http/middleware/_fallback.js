let exists = require('fs').existsSync
let join = require('path').join
let { parse } = require('url')
let invoker = require('../invoke-http')
let { readArc } = require('../../helpers')
let httpProxy = require('http-proxy')

/**
 * Emulates REST `/{proxy+}` & HTTP `$default`
 * - Forwards unmatched requests to `get /` (if present)
 * - Otherwise serves static assets found in /public
 */
module.exports = function fallback (req, res, next) {
  // Immediately exit to normal flow if /
  if (req.path === '/') next()
  else {
    let { arc } = readArc()
    let apiType = process.env.ARC_API_TYPE
    let httpAPI = apiType.startsWith('http')
    let deprecated = process.env.DEPRECATED
    let method = req.method.toLowerCase()

    // Read all routes
    let routes = arc.http || []
    // Add WebSocket route if necessary
    if (arc.ws) routes.push([ 'post', '/__arc' ])
    // Establish proxy
    let proxy = httpAPI && arc.proxy && arc.proxy.find(s => s[0] === 'testing')

    // Tokenize all routes: [ ['get', '/'], ... ]
    let tokens = routes.map(r => [ r[0] ].concat(r[1].split('/').filter(Boolean)))

    // Tokenize the current req: [ 'get', 'foo' ]
    let { pathname } = parse(req.url)
    let current = [ method ].concat(pathname.split('/').filter(Boolean))

    // Look for any exactly matching routes
    let exact = tokens.filter(t => !t.some(v => v.startsWith(':')))
    let exactMatch = exact.some(t => t.join('') === current.join(''))

    // Look for method type `any` on a matching route
    let anyMethodMatch = routes.some(r => {
      let method = r[0]
      let path = r[1]
      return method === 'any' && path === pathname
    })

    // Look for any route parameter matches
    let params = tokens.filter(t => t.some(v => v.startsWith(':')))
    let paramMatch = params.filter(t => t.length === current.length).some(t => {
      // turn :foo tokens into (\S+) regexp
      let exp = t.map(p => p.startsWith(':') ? '(\\S+)' : p).join('/')
      let reg = new RegExp(exp)
      return reg.test(current.join('/'))
    })

    // Look for a catchall matches
    let catchall = tokens.filter(t => t.some(v => v === '*'))
    let catchallFound = catchall.some(t => {
      let exp = t.map(p => p === '*' ? '.*' : p).join('/')
      let reg = new RegExp(exp)
      // Ensure trailing slashes match the root of the catchall
      let path = current.join('/') + `${pathname.endsWith('/') ? '/' : ''}`
      return reg.test(path)
    })
    let catchallMatch = catchallFound && httpAPI // Only supported by us in Arc 7 HTTP

    // Check to see if we're using the vendored proxy
    let findGetIndex = tuple => tuple[0].toLowerCase() === 'get' && tuple[1] === '/'
    let proxyAtRoot = (!arc.http) || (arc.http && !arc.http.some(findGetIndex))

    // Bail on exact, param, or catchall matches
    let match = exactMatch || anyMethodMatch || paramMatch || catchallMatch

    // Arc v5 doesn't support implicit proxy at root, move along
    let invalid = proxyAtRoot && deprecated

    // Determine whether this is a proxy req
    let nonGetRequestToRoot = method !== 'get' && pathname === '/'
    let isProxy = pathname !== '/' || nonGetRequestToRoot

    if (match || invalid) {
      next()
    }
    else if (proxy) {
      let proxyServer = httpProxy.createProxyServer()
      proxyServer.web(req, res, { target: proxy[1] }, err => {
        if (err) res.end(err.message)
      })
    }
    else if (nonGetRequestToRoot && !httpAPI) {
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
        let global = join(__dirname, '..', '..', '..', '..', 'http-proxy', 'dist')
        // Sandbox running from a local (symlink) context (usually testing/dev)
        let local = join(__dirname, '..', '..', '..', 'node_modules', '@architect', 'http-proxy', 'dist')
        if (exists(global)) pathToFunction = global
        else if (exists(local)) pathToFunction = local
      }

      // Invoke with a proxy / $default payload
      let exec = invoker({
        method,
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
