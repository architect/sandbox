let { join } = require('path')
let proxyquire = require('proxyquire')
let sinon = require('sinon')
let test = require('tape')
let _inventory = require('@architect/inventory')
let update = require('@architect/utils').updater()
let mock = join(process.cwd(), 'test', 'mock')

let fake = (params, callback) => callback(null, params)
let nodeFake = sinon.fake(fake)
let pythonFake = sinon.fake(fake)
let rubyFake = sinon.fake(fake)
let denoFake = sinon.fake(fake)
let invoke = proxyquire('../../../../src/invoke-lambda', {
  './run-in-node': nodeFake,
  './run-in-python': pythonFake,
  './run-in-ruby': rubyFake,
  './run-in-deno': denoFake
})
let event = { something: 'happened' }
let inventory = { inv: {} }
let inv
let get

test('Set up env', t => {
  t.plan(3)
  t.ok(invoke, 'Got invoke')
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
  t.plan(27)
  let lambda

  lambda = get.http('get /')
  invoke({ lambda, event, inventory, update }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'Default runtime passed correct path')
    t.equals(timeout, 5000, 'Default runtime ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'Default runtime received event')
  })

  lambda = get.http('get /nodejs12.x')
  invoke({ lambda, event, inventory, update }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'nodejs12.x passed correct path')
    t.equals(timeout, 12000, 'nodejs12.x ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'nodejs12.x received event')
  })

  lambda = get.http('get /nodejs10.x')
  invoke({ lambda, event, inventory, update }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'nodejs10.x passed correct path')
    t.equals(timeout, 10000, 'nodejs10.x ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'nodejs10.x received event')
  })

  lambda = get.http('get /nodejs8.10')
  invoke({ lambda, event, inventory, update }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'nodejs8.10 passed correct path')
    t.equals(timeout, 810000, 'nodejs8.10 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'nodejs8.10 received event')
  })

  lambda = get.http('get /python3.8')
  invoke({ lambda, event, inventory, update }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'python3.8 passed correct path')
    t.equals(timeout, 38000, 'python3.8 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'python3.8 received event')
  })

  lambda = get.http('get /python3.7')
  invoke({ lambda, event, inventory, update }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'python3.7 passed correct path')
    t.equals(timeout, 37000, 'python3.7 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'python3.7 received event')
  })

  lambda = get.http('get /python3.6')
  invoke({ lambda, event, inventory, update }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'python3.6 passed correct path')
    t.equals(timeout, 36000, 'python3.6 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'python3.6 received event')
  })

  lambda = get.http('get /ruby2.5')
  invoke({ lambda, event, inventory, update }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'ruby2.5 passed correct path')
    t.equals(timeout, 25000, 'ruby2.5 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'ruby2.5 received event')
  })

  lambda = get.http('get /deno')
  invoke({ lambda, event, inventory, update }, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, lambda.src, 'deno passed correct path')
    t.equals(timeout, 10000, 'deno ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'deno received event')
  })
})

test('Verify call counts from runtime invocations', t => {
  t.plan(4)
  t.equals(nodeFake.callCount, 4, 'Node called correct number of times')
  t.equals(pythonFake.callCount, 3, 'Python called correct number of times')
  t.equals(rubyFake.callCount, 1, 'Ruby called correct number of times')
  t.equals(denoFake.callCount, 1, 'Deno called correct number of times')
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
  invoke({ lambda, event, inventory, update }, (err) => {
    t.ok(err instanceof Error, 'POST: > 6MB request bodies return an error')
    console.log(err.message)
  })
  event = { body: blobby(10) }
  invoke({ lambda, event, inventory, update }, (err) => {
    t.notOk(err instanceof Error, 'POST: sub 6MB request bodies are fine')
  })

  lambda = get.events('event-normal')
  event = snsify(blobby(6000001))
  invoke({ lambda, event, inventory, update }, (err) => {
    t.ok(err instanceof Error, 'Event: > 6MB request bodies return an error')
    console.log(err.message)
  })
  event = snsify(blobby(10))
  invoke({ lambda, event, inventory, update }, (err) => {
    t.notOk(err instanceof Error, 'Event: sub 6MB request bodies are fine')
  })
})
