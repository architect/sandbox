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
get     /binary
get     /nodejs12.x
get     /nodejs10.x
get     /nodejs8.10
get     /python3.8
get     /python3.7
get     /python3.6
get     /ruby2.5
get     /deno
get     /get-p-c/:param/*
get     /get-c/*
get     /no-return
get     /times-out
/custom
  method get
  src src/http/custom
post    /post
put     /put
patch   /patch
delete  /delete
head    /head
options /options
any     /any
any     /any-c/*
any     /any-p/:param

@ws
hello
custom
  src src/ws/custom-path

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
