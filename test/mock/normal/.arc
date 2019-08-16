@app
mockapp

@events
ping

@queues
pong

@http
get / # runs default (nodejs10.x)
get /binary # runs default (nodejs10.x)
get /nodejs8.10
get /python3.7
get /python3.6
get /ruby2.5
post /post
put /put
patch /patch
delete /delete

@tables
accounts
  accountID *String

@indexes
accounts
  email *String
