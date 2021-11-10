import importlib, json, os, platform, sys

config = json.loads(os.environ.get('__ARC_CONFIG__'))
index = importlib.import_module(config['handlerFile'])
handlerFn = config['handlerFunction']
handler = getattr(index, handlerFn)

req = sys.stdin.readlines()
con = os.environ.get('__ARC_CONTEXT__')
event = json.loads(req[0])
context = json.loads(con)
result = '__ARC__ ' + json.dumps(handler(event, context)) + ' __ARC_END__'
meta = '__ARC_META__' + json.dumps({}) + '__ARC_META_END__'

'''Always output __ARC_META__ first'''
print(meta, flush=True)
print(result, flush=True)
