import importlib, json, os, sys

config = json.loads(os.environ.get('__ARC_CONFIG__'))
sys.path.append(os.path.dirname(config['handlerFile']))
module = os.path.splitext(os.path.basename(config['handlerFile']))[0]
handlerFile = importlib.import_module(module)
sys.path.pop()
handlerFn = config['handlerFunction']
handler = getattr(handlerFile, handlerFn)

req = sys.stdin.readlines()
con = os.environ.get('__ARC_CONTEXT__')
event = json.loads(req[0])
context = json.loads(con)
result = '__ARC__ ' + json.dumps(handler(event, context)) + ' __ARC_END__'

print(result, flush=True)
