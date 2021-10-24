exports.handler = async (event, context) => {
  const body = event
  body.message = 'hello get /first/second'
  body.context = context
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
