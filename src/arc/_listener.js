let _ssm = require('./_ssm')

module.exports = function _arcListener ({ inventory }, req, res) {
  function end () {
    res.statusCode = 404
    res.end()
    return
  }
  if (req.method.toLowerCase() === 'post') {
    let body = ''

    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      if (req.url === '/_arc/ssm') {
        _ssm({ inventory, body }, req, res)
        return
      }
      else end()
    })
  }
  else end()
}
