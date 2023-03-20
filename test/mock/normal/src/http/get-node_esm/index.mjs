async function handler (event) {
  const body = event
  body.message = 'Hello from get /node-esm (running in ESM mode)'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}

export { handler }
