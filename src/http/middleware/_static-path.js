let fs = require('fs')
let url = require('url')
let send = require('send')
let path = require('path')

/**
 * Serves static assets out of /_static
 */
module.exports = function _static (req, res, next) {
  let isStatic = req.url.startsWith('/_static')
  if (isStatic) {
    sends(req, res, next)
  }
  else {
    next()
  }
}

function sends (req, res, next) {
  let basePath = req.url.replace('/_static', '')
  if (!basePath || basePath === '/')
    basePath = 'index.html'

  let root = process.env.ARC_SANDBOX_PATH_TO_STATIC
  let pathToFile = url.parse(basePath).pathname
  let fullPath = path.join(root, decodeURI(pathToFile))

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

    send(req, pathToFile, { root })
      .on('error', error)
      .on('directory', redirect)
      .pipe(res)
  }
}
