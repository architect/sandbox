import os
import json
import index

req = os.environ.get('__ARC_REQ__')
context = os.environ.get('__ARC_CONTEXT__')
event = json.loads(req)
result = '__ARC__' + json.dumps(index.handler(event, context))

print(result, flush=True)
