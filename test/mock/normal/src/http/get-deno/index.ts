export async function handler (req: object) {
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Architect Sandbox running deno!')
  };
  return response;
}
