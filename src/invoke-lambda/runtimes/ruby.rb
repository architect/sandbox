require 'json'
request = JSON.parse(STDIN.gets)

config = JSON.parse(ENV['__ARC_CONFIG__'])
index = './' + config['handlerFile']
require index
handlerFn = config['handlerFunction']

context = JSON.parse(ENV['__ARC_CONTEXT__'])
result = '__ARC__ '
resultEnd = ' __ARC_END__'
begin
  result += send(handlerFn, request, context).to_json
  result += resultEnd
rescue
  result += send(handlerFn).to_json
  result += resultEnd
end
meta = '__ARC_META__ ' + { version: RUBY_VERSION }.to_json + ' __ARC_META_END__'

=begin
Always output __ARC_META__ first
=end
puts meta
puts result
exit(0)
