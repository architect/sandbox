exports.handler = async (event) => {
  const body = event
  body.message = 'Hello from put /put'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
