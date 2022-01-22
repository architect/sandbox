let { join } = require('path')
let { parse } = require('url')
let invoker = require('../invoke-http')
let httpProxy = require('http-proxy')

/**
 * Handle request fallthrough to @proxy + Arc Static Asset Proxy (ASAP)
 * In order:
 * - Matches
 * - @proxy handling (if present)
 * - ASAP handling (if present)
 * - Error out
 */
module.exports = function fallback (args, req, res, next) {
  let { apiType, cwd, inventory, ports, staticPath, update } = args
  let { inv, get } = inventory
  let httpAPI = apiType.startsWith('http')
  let method = req.method.toLowerCase()

  // Read all routes
  let routes = inv.http || []
  // Establish proxy
  let proxy = httpAPI && get.proxy('testing')

  // Tokenize all routes: [ ['get', '/'], ... ]
  let tokens = routes.map(route => {
    let { method, path, arcStaticAssetProxy: asap } = route
    if (!asap) return [ method ].concat(path.split('/').filter(Boolean))
  }).filter(Boolean)

  // Tokenize the current req: [ 'get', 'foo' ]
  let { pathname } = parse(req.url)
  let current = [ method ].concat(pathname.split('/').filter(Boolean))

  // Look for any exactly matching routes
  let exact = tokens.filter(t => !t.some(v => v.startsWith(':')))
  let exactMatch = exact.some(t => t.join('') === current.join(''))

  // Look for method type `any` on a matching route
  let anyMethodFound = routes.some(({ method, path }) => method === 'any' && path === pathname)
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

  // Establish root handler status
  let rootHandler = inv._project.rootHandler
  let hasASAP = rootHandler === 'arcStaticAssetProxy'

  // Bail on exact, param, or catchall matches
  let match = exactMatch || anyMethodMatch || paramsMatch || catchallMatch

  // Backwards compatibility with Arc 6+ `REST`'s greedy `get /` (deprecated in Arc 8 `HTTP`)
  let restGreedyRoot = apiType === 'rest' && rootHandler && pathname !== '/'

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
    invokeProxy(inv._project.asapSrc, true)
  }
  // HTTP APIs can fall back to /:param (REST APIs cannot)
  else if (rootParam && httpAPI) {
    let name = `${rootParam[0]} /${rootParam[1]}`
    let lambda = get.http(name)
    let exec = invoker({
      cwd,
      lambda,
      apiType,
      inventory,
      ports,
      update,
      userEnv: {},
    })
    req.params = { [rootParam[1].substr(1)]: '' }
    exec(req, res)
  }
  // Arc 6 greedy `get /{proxy+}`
  else if (restGreedyRoot) {
    let src = join(cwd, 'src', 'http', 'get-index') // We can assume this file path bc custom didn't land until Arc 8
    invokeProxy(src, false)
  }
  else if (inv._project.plugins) {
    // in case the project has plugins, plugins may override http server behaviour in sandbox with additional routes.
    // just to be safe, we invoke next() here in case plugins wanna do their thing (we only lose the nicely-formatted HTTP message in the next `else` below)
    next()
  }
  // Failure
  else {
    res.statusCode = 403
    res.setHeader('content-type', 'text/html; charset=utf-8;')
    let message = `Endpoint does not exist for ${method} ${pathname}<br>Add <code>@http ${method} ${pathname}</code> to your Architect project manifest (and create a corresponding handler)`
    res.end(message)
  }

  // Invoke a root proxy payload
  function invokeProxy (src, arcStaticAssetProxy) {
    let exec = invoker({
      apiType,
      cwd,
      lambda: {
        name: 'get /*',
        method: 'get',
        path: '/*',
        src,
        config: inv._project.defaultFunctionConfig,
        handlerFile: join(src, 'index.js'),
        handlerFunction: 'handler',
        arcStaticAssetProxy,
        // In the case of REST greedy root skipping the handler check could lead to broken requests, but it's really legacy now and fixing it isn't worth the trouble
        _skipHandlerCheck: true,
      },
      inventory,
      ports,
      staticPath,
      update,
      userEnv: {},
    })
    let proxy = pathname.startsWith('/') ? pathname.substr(1) : pathname
    req.params = { proxy }
    req.resource = '/{proxy+}'
    exec(req, res)
  }
}
