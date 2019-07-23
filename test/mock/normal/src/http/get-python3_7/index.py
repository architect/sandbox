# Boilerplate Lambda function pulled from AWS
import json

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Architect Sandbox running python3.7!')
    }
