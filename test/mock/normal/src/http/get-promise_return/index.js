exports.handler = () => {
  const body = { message: 'Hello from get /promise-return' }
  return Promise.resolve({
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
}
