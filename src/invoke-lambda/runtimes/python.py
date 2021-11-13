import importlib, json, os, platform, sys

config = json.loads(os.environ.get('__ARC_CONFIG__'))
context = json.loads(os.environ.get('__ARC_CONTEXT__'))
del os.environ['__ARC_CONFIG__']
del os.environ['__ARC_CONTEXT__']

index = importlib.import_module(config['handlerFile'])
handlerFn = config['handlerFunction']
handler = getattr(index, handlerFn)

req = sys.stdin.readlines()
event = json.loads(req[0])
result = '__ARC__ ' + json.dumps(handler(event, context)) + ' __ARC_END__'
meta = '__ARC_META__' + json.dumps({}) + '__ARC_META_END__'

'''Always output __ARC_META__ first'''
print(meta, flush=True)
print(result, flush=True)
