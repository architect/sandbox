import os
import json
import index

req = os.environ.get('__ARC_REQ__')
con = os.environ.get('__ARC_CONTEXT__')
event = json.loads(req)
context = json.loads(con)
result = '__ARC__ ' + json.dumps(index.handler(event, context)) + ' __ARC_END__'

print(result, flush=True)
