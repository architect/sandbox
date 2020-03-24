import os
import json
import index
import sys

req = sys.stdin.readlines()
con = os.environ.get('__ARC_CONTEXT__')
event = json.loads(req[0])
context = json.loads(con)
result = '__ARC__ ' + json.dumps(index.handler(event, context)) + ' __ARC_END__'

print(result, flush=True)
