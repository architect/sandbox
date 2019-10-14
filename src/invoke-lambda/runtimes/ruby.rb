require 'json'
require './index'

request = {event: JSON.parse(ENV['__ARC_REQ__'])}
context = {event: JSON.parse(ENV['__ARC_CONTEXT__'])}
response = '__ARC__ '
responseEnd = ' __ARC_END__'

begin
  response += handler(request, context).to_json
  response += responseEnd
rescue
  response += handler(request).to_json
  response += responseEnd
end

puts response
exit(0)
