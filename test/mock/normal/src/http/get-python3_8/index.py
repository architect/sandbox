import json

def handler(event, context):
    body = event
    body['message'] = 'Hello from get /python3.8 (running python3.8)'
    return {
        'statusCode': 200,
        'headers': { 'content-type': 'application/json' },
        'body': json.dumps(body)
    }
