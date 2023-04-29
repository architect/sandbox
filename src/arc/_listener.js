let _ssm = require('./_ssm')
let _ws = require('./_ws')
let { runtimeAPI }  = require('./_runtime-api')

module.exports = function _arcListener (services, params, req, res) {
  let raw = []

  req.on('data', chunk => raw.push(chunk))

  req.on('end', () => {
    let body = Buffer.concat(raw).toString()

    // Parameter store
    if (req.url.startsWith('/_arc/ssm')) {
      _ssm({ body, services }, params, req, res)
      return
    }
    // API Gateway v2 management API
    if (req.url.startsWith('/_arc/ws')) {
      _ws({ body }, req, res)
      return
    }
    // Lambda Runtime API
    if (req.url.includes('/2018-06-01/runtime/')) {
      runtimeAPI({ body }, params, req, res)
      return
    }
    res.statusCode = 404
    res.end()
  })
}
