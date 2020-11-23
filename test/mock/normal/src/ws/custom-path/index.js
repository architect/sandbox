let arc = require('@architect/functions')

exports.handler = async function ws (req) {
  await arc.ws.send({
    id: req.requestContext.connectionId,
    payload: {
      event: 'custom',
      req
    },
  })
  return { statusCode: 200 }
}
