@app
mockapp

@events
ping

@queues
pong

@http
get /           # runs default
get /binary     # runs default
get /nodejs12.x
get /nodejs10.x
get /nodejs8.10
get /python3.8
get /python3.7
get /python3.6
get /ruby2.5
get /deno
get /no-return  # runs default
get /times-out  # runs default
post /post
put /put
patch /patch
delete /delete

@tables
accounts
  accountID *String

pets
  accountID *String

@indexes
accounts
  email *String

pets
  petID *String

pets
  accountID *String
  petID **String
