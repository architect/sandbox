require 'json'
require 'net/http'

config = JSON.parse(ENV['__ARC_CONFIG__'])
context = JSON.parse(ENV['__ARC_CONTEXT__'])
runtime_api = ENV['AWS_LAMBDA_RUNTIME_API']
ENV.delete('__ARC_CONFIG__')
ENV.delete('__ARC_CONTEXT__')

url = -> (p) { runtime_api + '/2018-06-01/runtime/' + p }
headers = { 'content-type': 'application/json; charset=utf-8' }

begin
  next_uri = URI(url.call('invocation/next'))
  invocation = Net::HTTP.get_response(next_uri)
  event = JSON.parse(invocation.body)

  request_id = invocation['Lambda-Runtime-Aws-Request-Id'] || invocation['lambda-runtime-aws-request-id']
  error_endpoint = URI(url.call('invocation/' + request_id + '/error'))
  response_endpoint = URI(url.call('invocation/' + request_id + '/response'))

  begin
    handler_file = config['handlerFile']
    handler_method = config['handlerMethod']
    require handler_file
    result = send(handler_method, **{event: event, context: context}).to_json
    Net::HTTP.post(response_endpoint, result, headers)

  rescue => err
    puts err
    body = {
      'errorType' => err.cause,
      'errorMessage' => err.message,
      'stackTrace' => err.backtrace
    }
    puts body.to_json
    Net::HTTP.post(error_endpoint, body.to_json, headers)
  end

rescue => err
  puts err
  init_error_endpoint = URI(url.call('init/error'))
  body = {
    'errorType' => err.cause,
    'errorMessage' => err.message,
    'stackTrace' => err.backtrace
  }
  Net::HTTP.post(init_error_endpoint, body.to_json, headers)

end
