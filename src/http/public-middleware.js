let fs = require('fs')
let url = require('url')
let send = require('send')
let path = require('path')
let exists = fs.existsSync
let pathToRegExp = require('path-to-regexp')

/**
 * serves static assets found in ./public
 */
module.exports = function publicMiddleware(arc) {

  // look for get /
  let findGetIndex = tuple=> tuple[0].toLowerCase() === 'get' && tuple[1] === '/'
  let hasGetIndex = arc.http.some(findGetIndex)

  // turn all .arc defined GET paths into regexps
  let onlyGet = tuple=> tuple[0].toLowerCase() === 'get'
  let getPath = tuple=> pathToRegExp(tuple[1])
  let tests = arc.http.filter(onlyGet).map(getPath)

  if (hasGetIndex) {
    // we have a user defined getindex
    return function(req, res, next) {
      let isStatic = req.url.startsWith('/_static')
      if (isStatic) {
        sends(req, res, next)
      }
      else {
        next()
      }
    }
  }
  else {
    // we are pretending we are getindex
    return function newPublicMiddleware(req, res, next) {
      // only get requests for static assets
      if (req.method != 'get') next()
      else {
        // check for matching lambda route
        let match = tests.some(regexp=> regexp.test(req.path))
        if (match) next()
        else {
          // ok, no matches and a get request
          // try to look in public
          sends(req, res, next)
        }
      }
    }
  }
}

function sends(req, res, next) {

  let basePath = req.url.replace('/_static', '')
  if (!basePath || basePath === '/')
    basePath = 'index.html'

  let pathToFile = url.parse(basePath).pathname
  let fullPath = path.join(process.cwd(), 'public', decodeURI(pathToFile))

  let found = exists(fullPath) && fs.statSync(fullPath).isFile()
  if (!found) {
    next()
  }
  else {
    function error(err) {
      res.statusCode = err.status || 500
      res.end(err.message)
    }

    function redirect() {
      res.statusCode = 301
      res.setHeader('Location', req.url + '/')
      res.end('\n')
    }

    send(req, pathToFile, {root: 'public'})
      .on('error', error)
      .on('directory', redirect)
      .pipe(res)
  }
}
