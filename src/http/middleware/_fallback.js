let { existsSync: exists } = require('fs')
let { join } = require('path')
let { parse } = require('url')
let invoker = require('../invoke-http')
let { readArc } = require('../../helpers')
let httpProxy = require('http-proxy')
let { getLambdaName: name } = require('@architect/utils')

/**
 * Handle request fallthrough to @proxy + Arc Static Asset Proxy (ASAP)
 * In order:
 * - Matches
 * - @proxy handling (if present)
 * - ASAP handling (if present)
 * - Error out
 */
module.exports = function fallback (req, res, next) {
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
  let anyMethodFound = routes.some(r => {
    let method = r[0]
    let path = r[1]
    return method === 'any' && path === pathname
  })
  let anyMethodMatch = anyMethodFound && httpAPI // Only implemented in Arc 8 HTTP

  // Look for any route parameter matches
  let params = tokens.filter(t => t.some(v => v.startsWith(':')))
  let paramsFound = params.filter(t => t.length === current.length)
  let paramsMatch = paramsFound.some(p => {
    // Make copies because we may mutate
    let t = [ ...p ]
    // Capture 'any' routes (but only in HTTP APIs)
    if (t[0] === 'any' && httpAPI) t[0] = method
    // Turn :foo tokens into (\S+) regexp
    let exp = t.map(p => p.startsWith(':') ? '(\\S+)' : p).join('/')
    let reg = new RegExp(exp)
    return reg.test(current.join('/'))
  })

  // Case for HTTP APIs: params at root (`/:param`) handle root requests
  let rootParamFound = params.filter(t => t.length === 2 && current.length === 1)
  let rootParam = rootParamFound.find(p => {
    // Capture 'any' routes
    if (p[0] === 'any' && httpAPI) p[0] = method
    return p[0] === current[0]
  })

  // Look for a catchall matches (which may also contain params)
  let catchall = tokens.filter(t => t.some(v => v === '*'))
  let catchallFound = catchall.some(p => {
    // Make a copy because we may mutate
    let t = [ ...p ]
    // Capture 'any' routes (but only in HTTP APIs)
    if (t[0] === 'any' && httpAPI) t[0] = method
    let exp = t.map(p => {
      if (p === '*') return '.*'
      if (p.startsWith(':')) return '(\\S+)'
      return p
    }).join('/')
    let reg = new RegExp(exp)
    // Ensure trailing slashes match the root of the catchall
    let path = current.join('/') + `${pathname.endsWith('/') ? '/' : ''}`
    return reg.test(path)
  })
  let catchallMatch = catchallFound && httpAPI // Only implemented in Arc 8 HTTP

  // Check to see if we're using ASAP
  let findRoot = r => {
    let method = r[0].toLowerCase()
    let path = r[1]
    let rootParam = path.startsWith('/:') && path.split('/').length === 2
    let isRootMethod = httpAPI
      ? method === 'get' || method === 'any'
      : method === 'get'
    // Literal root, root catchall, or root params should cancel out ASAP
    let isRootPath = httpAPI
      ? path === '/' || path === '/*' || rootParam
      : path === '/'
    return isRootMethod && isRootPath
  }
  let hasRoot = arc.http && arc.http.some(findRoot)
  let hasASAP = !hasRoot && !arc.proxy && !rootParam && !deprecated

  // Bail on exact, param, or catchall matches
  let match = exactMatch || anyMethodMatch || paramsMatch || catchallMatch

  // Backwards compatibility with Arc 6+ REST's greedy `get /` (deprecated in Arc 8)
  let restGreedyRoot = apiType === 'rest' && !deprecated && hasRoot && pathname !== '/'

  // Matches
  if (match) {
    next()
  }
  // @proxy
  else if (proxy) {
    let proxyServer = httpProxy.createProxyServer()
    proxyServer.web(req, res, { target: proxy[1] }, err => {
      if (err) res.end(err.message)
    })
  }
  // ASAP – not supported by Arc <6, supported by Arc 6+
  else if (hasASAP) {
    // Sandbox running as a dependency (most common use case)
    let pathToFunction = join(process.cwd(), 'node_modules', '@architect', 'http-proxy', 'dist')
    // Sandbox running as a global install
    let global = join(__dirname, '..', '..', '..', '..', 'http-proxy', 'dist')
    // Sandbox running from a local (symlink) context (usually testing/dev)
    let local = join(__dirname, '..', '..', '..', 'node_modules', '@architect', 'http-proxy', 'dist')
    if (exists(global)) pathToFunction = global
    else if (exists(local)) pathToFunction = local
    invokeProxy(pathToFunction)
  }
  // HTTP APIs can fall back to /:param (REST APIs cannot)
  else if (rootParam && httpAPI) {
    let pathToFunction = join(process.cwd(), 'src', 'http', `${rootParam[0]}-${name(rootParam[1])}`)
    let exec = invoker({
      method,
      route: `/${rootParam[1]}`,
      pathToFunction,
      apiType
    })
    req.params = { [rootParam[1].substr(1)]: '' }
    exec(req, res)
  }
  // Arc 6 greedy `get /{proxy+}`
  else if (restGreedyRoot) {
    let pathToFunction = join(process.cwd(), 'src', 'http', `get-index`)
    invokeProxy(pathToFunction)
  }
  // Failure
  else {
    res.statusCode = 403
    res.setHeader('content-type', 'text/html; charset=utf-8;')
    let message = `Endpoint does not exist for ${method} ${pathname}<br>Add <code>@http ${method} ${pathname}</code> to your Architect project manifest (and create a corresponding handler)`
    res.end(message)
  }

  // Invoke a root proxy payload
  function invokeProxy (pathToFunction) {
    let exec = invoker({
      method,
      pathToFunction,
      apiType
    })
    let proxy = pathname.startsWith('/') ? pathname.substr(1) : pathname
    req.params = { proxy }
    req.resource = '/{proxy+}'
    exec(req, res)
  }
}
