let pool = require('../../http/register-websocket/pool')

module.exports = function _ws ({ body }, req, res) {
  const connectionId = req.url.replace(/^\/_arc\/ws\/@connections\//, '')
  res.statusCode = 200

  let ws = pool.getConnection(connectionId)
  if (!ws) {
    res.setHeader('x-amzn-ErrorType', 'GoneException')
    res.statusCode = 410
    res.end()
    return
  }

  if (req.method === 'DELETE') {
    ws.on('close', () => res.end())
    ws.close()
    return
  }

  if (req.method === 'GET') {
    // from https://github.com/aws/aws-sdk-js/blob/307e82673b48577fce4389e4ce03f95064e8fe0d/apis/apigatewaymanagementapi-2018-11-29.normal.json#L132
    const output = {
      connectedAt: new Date(pool.getConnectedAt(connectionId)).toISOString(),
      // lastActiveAt: 'I wish this was easy to figure out but it is optional',
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

  res.statusCode = 403
  res.end()
}
