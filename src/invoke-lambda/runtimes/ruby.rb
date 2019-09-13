require 'json'
require './index'

request = {event: JSON.parse(ENV['__ARC_REQ__'])}
context = {event: JSON.parse(ENV['__ARC_CONTEXT__'])}
response = '__ARC__'

begin
  response += handler(request, context).to_json
rescue
  response += handler(request).to_json
end

puts response
exit(0)
