# Boilerplate Lambda function pulled from AWS
#   Slightly modified: `(event:, context:)` → `(event, context)`
require 'json'

def handler(event:, context:)
    body = event
    body[:message] = 'Hello from get /ruby3.2 (running ruby3.2)'
    body[:context] = context
    {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.generate(body)
    }
end
