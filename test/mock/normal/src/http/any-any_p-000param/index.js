exports.handler = async (event) => {
  const body = event
  body.message = 'Hello from any /any-p/:param'
  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      body: JSON.stringify(body) // Specifically for HEAD requests
    },
    body: JSON.stringify(body)
  }
}
