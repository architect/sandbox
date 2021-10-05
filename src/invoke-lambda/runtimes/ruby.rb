require 'json'
request = JSON.parse(STDIN.gets)

config = JSON.parse(ENV['__ARC_CONFIG__'])
index = './' + config['handlerFile']
require index
handlerFn = config['handlerFunction']

context = JSON.parse(ENV['__ARC_CONTEXT__'])
response = '__ARC__ '
responseEnd = ' __ARC_END__'

begin
  response += send(handlerFn, request, context).to_json
  response += responseEnd
rescue
  response += send(handlerFn).to_json
  response += responseEnd
end

puts response
exit(0)
