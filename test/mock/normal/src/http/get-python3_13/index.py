import json


def handler(event, context):
    body = event
    body["message"] = "Hello from get /python3.13 (running python3.13)"
    body["context"] = context
    return {
        "statusCode": 200,
        "headers": {"content-type": "application/json"},
        "body": json.dumps(body),
    }
