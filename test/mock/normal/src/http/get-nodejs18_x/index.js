exports.handler = async (event) => {
  const body = event
  body.message = 'Hello from get /nodejs18.x (running nodejs18.x)'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
