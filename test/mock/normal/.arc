@app
mockapp

@events
ping

@queues
pong

@http
get     /           # runs default
get     /binary
get     /nodejs12.x
get     /nodejs10.x
get     /nodejs8.10
get     /python3.8
get     /python3.7
get     /python3.6
get     /ruby2.5
get     /deno
get     /path/*
get     /path/:param/*
get     /env
get     /no-return
get     /times-out
post    /post
put     /put
patch   /patch
delete  /delete
head    /head
options /options
any     /any
any     /any-c/*
any     /any-p/:param

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
