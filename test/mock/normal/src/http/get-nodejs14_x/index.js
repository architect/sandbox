exports.handler = async (event) => {
  const body = event
  body.message = 'Hello from get /nodejs14.x (running nodejs14.x)'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
