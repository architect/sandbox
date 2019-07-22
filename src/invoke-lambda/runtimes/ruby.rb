require 'json'
require './index'

request = JSON.parse(ENV['__ARC_REQ__'])
context = ENV['__ARC_CONTEXT__']
response = '__ARC__' + handler(request, context).to_json

puts response
exit(0)
