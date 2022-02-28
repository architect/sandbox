let _ssm = require('./_ssm')
let _ws = require('./_ws')

module.exports = function _arcListener (services, params, req, res) {
  let body = ''

  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', () => {
    if (req.url === '/_arc/ssm') {
      _ssm({ body, services }, params, req, res)
      return
    }
    if (req.url.startsWith('/_arc/ws')) {
      _ws({ body }, req, res)
      return
    }
    res.statusCode = 404
    res.end()
  })
}
