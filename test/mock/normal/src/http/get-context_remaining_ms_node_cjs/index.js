exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ remaining: context.getRemainingTimeInMillis() })
  }
}
