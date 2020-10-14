exports.handler = async (event) => {
  const body = event
  body.message = 'Hello from any /get-p-c/:param/*'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
