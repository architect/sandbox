let { join } = require('path')
let proxyquire = require('proxyquire')
let test = require('tape')
let _inventory = require('@architect/inventory')
let update = require('@architect/utils').updater()
let mock = join(process.cwd(), 'test', 'mock')

let runtimes = {
  asap: 0,
  deno: 0,
  node: 0,
  python: 0,
  ruby: 0
}
let exec = (run, params, callback) => {
  runtimes[run]++
  callback(null, params)
}
let invoke = proxyquire('../../../../src/invoke-lambda', {
  './exec': exec,
})
let event = { something: 'happened' }
let inventory = { inv: { app: 'hi' } }
let ports = {}
let userEnv = {}
let params = { event, inventory, update, userEnv, ports }
let inv
let get

test('Set up env', t => {
  t.plan(1)
  t.ok(invoke, 'Got invoke')
  process.env.ARC_ENV = 'testing' // Must be set for ARC_CLOUDFORMATION
})

test('Get inventory', t => {
  t.plan(2)
  _inventory({ cwd: join(mock, 'normal') }, function (err, result) {
    if (err) t.fail(err)
    else {
      inv = result.inv
      get = result.get
      t.ok(inv, 'Got inventory')
      t.ok(get, 'Got inventory getter')
    }
  })
})

test('Test runtime invocations', t => {
  t.plan(24)
  let lambda

  lambda = get.http('get /')
  invoke({ lambda, ...params }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'Default runtime passed correct path')
    t.equals(timeout, 5000, 'Default runtime ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'Default runtime received event')
  })

  lambda = get.http('get /nodejs14.x')
  invoke({ lambda, ...params }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'nodejs14.x passed correct path')
    t.equals(timeout, 14000, 'nodejs14.x ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'nodejs14.x received event')
  })

  lambda = get.http('get /nodejs12.x')
  invoke({ lambda, ...params }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'nodejs12.x passed correct path')
    t.equals(timeout, 12000, 'nodejs12.x ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'nodejs12.x received event')
  })

  lambda = get.http('get /python3.8')
  invoke({ lambda, ...params }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'python3.8 passed correct path')
    t.equals(timeout, 38000, 'python3.8 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'python3.8 received event')
  })

  lambda = get.http('get /python3.7')
  invoke({ lambda, ...params }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'python3.7 passed correct path')
    t.equals(timeout, 37000, 'python3.7 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'python3.7 received event')
  })

  lambda = get.http('get /python3.6')
  invoke({ lambda, ...params }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'python3.6 passed correct path')
    t.equals(timeout, 36000, 'python3.6 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'python3.6 received event')
  })

  lambda = get.http('get /ruby2.7')
  invoke({ lambda, ...params }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'ruby2.7 passed correct path')
    t.equals(timeout, 25000, 'ruby2.7 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'ruby2.7 received event')
  })

  lambda = get.http('get /deno')
  invoke({ lambda, ...params }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'deno passed correct path')
    t.equals(timeout, 10000, 'deno ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'deno received event')
  })
})

// This test will still hit the node call counter at least once
test('Test body size limits', t => {
  t.plan(4)
  let blobby = size => Array(size).fill('a').join('')
  let snsify = str => ({ Records: [ { Sns: { Message: JSON.stringify(str) } } ] })
  let lambda
  let event

  lambda = get.http('post /post')
  event = { body: blobby(6000001) }
  invoke({ lambda, ...params, event }, (err) => {
    t.ok(err instanceof Error, 'POST: > 6MB request bodies return an error')
    console.log(err.message)
  })
  event = { body: blobby(10) }
  invoke({ lambda, ...params, event }, (err) => {
    t.notOk(err instanceof Error, 'POST: sub 6MB request bodies are fine')
  })

  lambda = get.events('event-normal')
  event = snsify(blobby(6000001))
  invoke({ lambda, ...params, event }, (err) => {
    t.ok(err instanceof Error, 'Event: > 6MB request bodies return an error')
    console.log(err.message)
  })
  event = snsify(blobby(10))
  invoke({ lambda, ...params, event }, (err) => {
    t.notOk(err instanceof Error, 'Event: sub 6MB request bodies are fine')
  })
})


test('Get inventory again to exercise ASAP', t => {
  t.plan(2)
  _inventory({ cwd: join(mock, 'no-index-pass') }, function (err, result) {
    if (err) t.fail(err)
    else {
      inv = result.inv
      get = result.get
      t.ok(inv, 'Got inventory')
      t.ok(get, 'Got inventory getter')
    }
  })
})

test('Test ASAP invocation', t => {
  t.plan(3)
  let lambda = get.http('get /*')
  invoke({ lambda, ...params }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'Default runtime passed correct path')
    t.equals(timeout, 5000, 'Default runtime ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'Default runtime received event')
  })
})

test('Verify call counts from runtime invocations', t => {
  t.plan(5)
  t.equals(runtimes.asap, 1, 'ASAP called correct number of times')
  t.equals(runtimes.deno, 1, 'Deno called correct number of times')
  t.equals(runtimes.node, 5, 'Node called correct number of times')
  t.equals(runtimes.python, 3, 'Python called correct number of times')
  t.equals(runtimes.ruby, 1, 'Ruby called correct number of times')
  delete process.env.ARC_ENV
})
