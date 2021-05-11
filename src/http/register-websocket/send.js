let pool = require('./pool')

module.exports = function send (req, res) {
  try {
    let ws = pool.getConnection(req.body.id)
    if (ws) {
      ws.send(JSON.stringify(req.body.payload))
    }
    else {
      let e = Error('GoneException: 410')
      e.code = 'GoneException'
      throw e
    }
  }
  catch (e) {
    console.log('Failed to ws.send', e)
  }
  res.statusCode = 200
  res.end('\n')
}
