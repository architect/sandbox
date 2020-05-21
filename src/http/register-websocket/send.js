let pool = require('./pool')

module.exports = function handle(req, res) {
  try {
    let record = pool.getConnection(req.body.id)
    console.log('called send and got record', record)
    //record.ws.send(JSON.stringify(req.body.payload))
  }
  catch(e) {
    console.log('Failed to ws.send', e)
  }
  res.statusCode = 200
  res.end('\n')
}
