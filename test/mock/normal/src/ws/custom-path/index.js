let arc = require('@architect/functions')

exports.handler = async function ws (event) {
  await arc.ws.send({
    id: event.requestContext.connectionId,
    payload: {
      functionName: 'custom',
      event
    },
  })
  return { statusCode: 200 }
}
