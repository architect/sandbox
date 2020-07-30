exports.handler = async (event) => {
  const body = event
  body.message = 'Hello from get /nodejs10.x (running nodejs10.x)'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
