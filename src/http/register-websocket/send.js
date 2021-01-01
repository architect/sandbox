let pool = require('./pool')

module.exports = function send (inventory, req, res) {
  try {
    let ws = pool.getConnection(req.body.id)
    if (ws) {
      let payload = { ...req.body.payload, inventory }
      ws.send(JSON.stringify(payload))
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
