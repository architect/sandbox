exports.handler = async (event) => {
  const body = event
  body.message = 'Hello from get /get-c/* running the default runtime'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
