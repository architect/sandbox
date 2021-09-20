exports.handler = async (event, context) => {
  const body = { event, context }
  body.message = 'Hello from get /context running the default runtime'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
