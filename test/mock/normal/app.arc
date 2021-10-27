@app
mockapp

@events
event-normal
event-custom
  src src/events/custom

@queues
queue-normal
queue-custom
  src src/queues/custom

@http
get     /           # runs default
get     /multi-cookies-res
get     /binary
get     /nodejs14.x
get     /nodejs12.x
get     /python3.8
get     /python3.7
get     /python3.6
get     /ruby2.7
get     /deno
get     /get-p-c/:param/*
get     /get-c/*
get     /no-return
get     /promise-return
get     /reject-promise
get     /throw-sync-error
get     /times-out
/custom
  method get
  src src/http/custom
get     /chonky
post    /post
put     /put
patch   /patch
delete  /delete
head    /head
options /options
any     /any
any     /any-c/*
any     /any-p/:param

@static

@ws
hello
custom
  src src/ws/custom-path
error

@tables
accounts
  accountID *String

pets
  accountID *String

places
  location *String

data
  account *String
  id **String

@indexes
accounts
  email *String

pets
  petID *String

pets
  accountID *String
  petID **String

data
  id *String

data
  location *String
  id **String

places
  name ByAltitude
  location *String
  altitude **Number
