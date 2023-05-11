export async function handler (event, context) {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ remaining: context.getRemainingTimeInMillis() })
  }
}
