# Boilerplate Lambda function pulled from AWS
#   Slightly modified: `(event:, context:)` → `(event, context)`
require 'json'

def handler(event, context)
    body = event
    body[:message] = 'Hello from Architect Sandbox running ruby2.5!'
    {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.generate(body)
    }
end
