exports.handler = async (event) => {
  const body = event
  body.message = 'Hello from get /nodejs22.x (running nodejs22.x)'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
