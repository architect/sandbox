exports.handler = async (event) => {
  let validSize = (1000 * 499 * 6)
  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: 'ü'.repeat(validSize)
  }
}
