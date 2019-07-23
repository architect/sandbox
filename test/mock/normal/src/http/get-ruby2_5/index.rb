# Boilerplate Lambda function pulled from AWS
#   Slightly modified: `(event:, context:)` → `(event, context)`
require 'json'

def handler(event, context)
    { statusCode: 200, body: JSON.generate('Hello from Architect Sandbox running ruby2.5!') }
end
