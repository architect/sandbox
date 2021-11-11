let _ssm = require('./_ssm')
let _ws = require('./_ws')

module.exports = function _arcListener ({ inventory }, req, res) {
  let body = ''

  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', () => {
    if (req.url === '/_arc/ssm') {
      _ssm({ inventory, body }, req, res)
      return
    }
    if (req.url.startsWith('/_arc/ws')) {
      _ws({ inventory, body }, req, res)
      return
    }
    res.statusCode = 404
    res.end()
  })
}
