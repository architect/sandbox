let pool = require('../../http/register-websocket/pool')

module.exports = function _ws ({ body }, req, res) {
  const connectionId = req.url.replace(/^\/_arc\/ws\/@connections\//, '')
  res.statusCode = 200

  let ws = pool.getConnection(connectionId)
  if (!ws) {
    res.statusCode = 404
    res.end()
    return
  }

  if (req.method === 'DELETE') {
    ws.close()
    res.end()
    return
  }

  if (req.method === 'GET') {
    const output = {
      ConnectedAt: new Date(pool.getConnectedAt(connectionId)).toISOString(),
      // LastActiveAt: 'I wish this was easy to figure out but it is optional',
    }
    res.end(JSON.stringify(output))
    return
  }

  if (req.method === 'POST') {
    ws.send(body, (err) => {
      if (err) {
        res.statusCode = 500
        res.end(err.message)
        return
      }
      res.end()
    })
    return
  }

  res.statusCode = 404
  res.end()
}
