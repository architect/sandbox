exports.handler = async (event) => {
  const body = event
  body.message = 'Hello from get /nodejs12.x (running nodejs12.x)'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
