exports.handler = async (event) => {
  let validSize = (1000 * 999 * 6)
  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: '.'.repeat(validSize)
  }
}
