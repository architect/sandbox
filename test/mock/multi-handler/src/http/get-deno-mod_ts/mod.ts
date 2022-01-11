export async function handler (req: any) {
  let body = req
  body.message = 'Hello from get /deno/mod.ts'
  const response = {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  };
  return response;
}
