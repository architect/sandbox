exports.handler = async (event) => {
  let invalidSize = (1000 * 1000 * 6) + 1
  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: '.'.repeat(invalidSize)
  }
}
