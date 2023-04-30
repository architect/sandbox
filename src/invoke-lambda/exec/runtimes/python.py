import json, os, traceback
from importlib import util
from urllib.request import urlopen, Request

config = json.loads(os.environ.get('__ARC_CONFIG__'))
context = json.loads(os.environ.get('__ARC_CONTEXT__'))
runtime_api = os.environ.get('AWS_LAMBDA_RUNTIME_API')
del os.environ['__ARC_CONFIG__']
del os.environ['__ARC_CONTEXT__']

url = lambda p : runtime_api + '/2018-06-01/runtime/' + p
headers = { 'content-type': 'application/json; charset=utf-8' }

try:
  next = url('invocation/next')
  request = Request(next, data=None, headers={})
  invocation = urlopen(request)
  event = json.loads(invocation.read())

  request_id = invocation.getheader('Lambda-Runtime-Aws-Request-Id') or invocation.getheader('lambda-runtime-aws-request-id')
  error_endpoint = url('invocation/' + request_id + '/error')
  response_endpoint = url('invocation/' + request_id + '/response')

  try:
    handler_file = config['handlerFile']
    handler_method = config['handlerMethod']
    module_dir, module_file = os.path.split(handler_file)
    spec = util.spec_from_file_location(module_file, handler_file)
    module = spec.loader.load_module()
    handler = getattr(module, handler_method)
    result = handler(event, context)
    data = json.dumps(result).encode('utf-8')
    request = Request(response_endpoint, data=data, headers=headers)
    urlopen(request)

  except Exception as handler_err:
    print(traceback.format_exc())
    errorType = getattr(handler_err, 'message', repr(handler_err))
    stackTrace = traceback.format_exc()
    data = json.dumps({ 'errorType': errorType, 'stackTrace': stackTrace }).encode('utf-8')
    request = Request(error_endpoint, data=data, headers=headers)
    urlopen(request)

except Exception as init_err:
  print(traceback.format_exc())
  init_error_endpoint = url('init/error')
  errorType = getattr(init_err, 'message', repr(init_err))
  stackTrace = traceback.format_exc()
  data = json.dumps({ 'errorType': errorType, 'stackTrace': stackTrace }).encode('utf-8')
  request = Request(init_error_endpoint, data=data, headers=headers)
  urlopen(request)
