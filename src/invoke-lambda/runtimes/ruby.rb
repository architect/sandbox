require 'json'
request = JSON.parse(STDIN.gets)

config = JSON.parse(ENV['__ARC_CONFIG__'])
context = JSON.parse(ENV['__ARC_CONTEXT__'])
ENV.delete('__ARC_CONFIG__')
ENV.delete('__ARC_CONTEXT__')

index = config['handlerFile']
require index
handlerFn = config['handlerMethod']

result = '__ARC__ '
resultEnd = ' __ARC_END__'
begin
  result += send(handlerFn, **{event:request, context:context}).to_json
  result += resultEnd
rescue
  result += send(handlerFn).to_json
  result += resultEnd
end
meta = '__ARC_META__ ' + {}.to_json + ' __ARC_META_END__'

=begin
Always output __ARC_META__ first
=end
puts meta
puts result
exit(0)
