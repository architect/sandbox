module.exports = function handleCors (req, res, next) {
  if (process.env.ARC_SANDBOX_ENABLE_CORS) {
    res.setHeader('access-control-allow-origin', '*')
    res.setHeader('access-control-request-method', '*')
    res.setHeader('access-control-allow-methods', 'OPTIONS, GET')
    res.setHeader('access-control-allow-headers', '*')
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }
  }
  else next()
}
