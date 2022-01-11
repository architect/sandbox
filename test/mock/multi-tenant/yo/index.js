exports.handler = async (event) => {
  const body = event
  body.message = 'Hello from a multi-tenant Lambda!'
  body.context = context
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
