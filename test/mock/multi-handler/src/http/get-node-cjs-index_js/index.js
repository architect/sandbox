exports.handler = async function handler (req) {
  let body = req
  body.message = 'Hello from get /node/cjs/index.js'
  const response = {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
  return response
}
