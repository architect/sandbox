let arc = require('@architect/functions')

exports.handler = async function ws (req) {
  await arc.ws.send({
    id: req.requestContext.connectionId,
    payload: {
      event: 'hello',
      req
    },
  })
  return { statusCode: 200 }
}
