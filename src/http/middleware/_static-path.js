// Don't destructure requires, so we can mock them in unit tests
let fs = require('fs')
let url = require('url')
let send = require('send')
let path = require('path')

/**
 * Serves static assets out of /_static
 */
module.exports = function _static ({ staticPath }, req, res, next) {
  let isStatic = req.url.startsWith('/_static')
  if (isStatic) {
    sends(staticPath, req, res, next)
  }
  else {
    next()
  }
}

function sends (staticPath, req, res, next) {
  let basePath = req.url.replace('/_static', '')
  if (!basePath || basePath === '/')
    basePath = 'index.html'

  let pathToFile = url.parse(basePath).pathname
  let fullPath = path.join(staticPath, decodeURI(pathToFile))

  let found = fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()
  if (!found) {
    next()
  }
  else {
    function error (err) {
      res.statusCode = err.status || 500
      res.end(err.message)
    }

    function redirect () {
      res.statusCode = 301
      res.setHeader('Location', req.url + '/')
      res.end('\n')
    }

    send(req, pathToFile, { root: staticPath })
      .on('error', error)
      .on('directory', redirect)
      .pipe(res)
  }
}
