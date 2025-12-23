exports.handler = async (event) => {
  const body = event
  body.message = 'Hello from get /nodejs24.x (running nodejs24.x)'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
