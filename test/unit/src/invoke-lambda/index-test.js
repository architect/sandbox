let { join } = require('path')
let proxyquire = require('proxyquire')
let test = require('tape')
let _inventory = require('@architect/inventory')
let update = require('@architect/utils').updater()
let cwd = process.cwd()
let mock = join(cwd, 'test', 'mock')
let { invocations } = require(join(cwd, 'src', 'arc', '_runtime-api'))
let { credentials: creds } = require(join(cwd, 'test', 'utils'))

let runtimes = {
  asap: 0,
  deno: 0,
  node: 0,
  python: 0,
  ruby: 0,
}
let execPassedParams
let exec = (lambda, params, callback) => {
  let { arcStaticAssetProxy } = lambda
  let { runtime } = lambda.config
  let run
  if (runtime.startsWith('node')) run = 'node'
  if (runtime.startsWith('deno')) run = 'deno'
  if (runtime.startsWith('python')) run = 'python'
  if (runtime.startsWith('ruby')) run = 'ruby'
  if (arcStaticAssetProxy) run = 'asap'
  runtimes[run]++
  execPassedParams = JSON.parse(JSON.stringify(params))
  invocations[params.requestID].response = event
  callback()
}
let invoke = proxyquire('../../../../src/invoke-lambda', {
  './exec': exec,
})
let event = { something: 'happened' }
let inventory = { inv: { _project: { env: { local: { testing: null, staging: null, production: null } } }, app: 'hi' } }
let ports = {}
let userEnv = {}
let params = { creds, event, inventory, update, userEnv, ports }
let inv
let get

test('Set up env', t => {
  t.plan(1)
  t.ok(invoke, 'Got invoke')
})

test('Get inventory', t => {
  t.plan(2)
  _inventory({ cwd: join(mock, 'normal') }, function (err, result) {
    if (err) t.end(err)
    else {
      inv = result.inv
      get = result.get
      t.ok(inv, 'Got inventory')
      t.ok(get, 'Got inventory getter')
    }
  })
})

test('Test runtime invocations', t => {
  t.plan(21)
  let lambda

  lambda = get.http('get /')
  invoke({ lambda, ...params }, (err, result) => {
    if (err) t.end(err)
    let { options, timeout } = execPassedParams
    t.equals(options.cwd, lambda.src, 'Default runtime passed correct path')
    t.equals(timeout, 5000, 'Default runtime ran with correct timeout')
    t.deepEqual(result, event, 'Default runtime received event')
  })

  lambda = get.http('get /nodejs20.x')
  invoke({ lambda, ...params }, (err, result) => {
    if (err) t.end(err)
    let { options, timeout } = execPassedParams
    t.equals(options.cwd, lambda.src, 'nodejs20.x passed correct path')
    t.equals(timeout, 20000, 'nodejs20.x ran with correct timeout')
    t.deepEqual(result, event, 'nodejs20.x received event')
  })

  lambda = get.http('get /nodejs18.x')
  invoke({ lambda, ...params }, (err, result) => {
    if (err) t.end(err)
    let { options, timeout } = execPassedParams
    t.equals(options.cwd, lambda.src, 'nodejs18.x passed correct path')
    t.equals(timeout, 12000, 'nodejs18.x ran with correct timeout')
    t.deepEqual(result, event, 'nodejs18.x received event')
  })

  lambda = get.http('get /python3.13')
  invoke({ lambda, ...params }, (err, result) => {
    if (err) t.end(err)
    let { options, timeout } = execPassedParams
    t.equals(options.cwd, lambda.src, 'python3.13 passed correct path')
    t.equals(timeout, 3000, 'python3.13 ran with correct timeout')
    t.deepEqual(result, event, 'python3.13 received event')
  })

  lambda = get.http('get /python3.9')
  invoke({ lambda, ...params }, (err, result) => {
    if (err) t.end(err)
    let { options, timeout } = execPassedParams
    t.equals(options.cwd, lambda.src, 'python3.9 passed correct path')
    t.equals(timeout, 3000, 'python3.9 ran with correct timeout')
    t.deepEqual(result, event, 'python3.9 received event')
  })

  lambda = get.http('get /ruby3.2')
  invoke({ lambda, ...params }, (err, result) => {
    if (err) t.end(err)
    let { options, timeout } = execPassedParams
    t.equals(options.cwd, lambda.src, 'ruby3.2 passed correct path')
    t.equals(timeout, 32000, 'ruby3.2 ran with correct timeout')
    t.deepEqual(result, event, 'ruby3.2 received event')
  })

  lambda = get.http('get /deno')
  invoke({ lambda, ...params }, (err, result) => {
    if (err) t.end(err)
    let { options, timeout } = execPassedParams
    t.equals(options.cwd, lambda.src, 'deno passed correct path')
    t.equals(timeout, 10000, 'deno ran with correct timeout')
    t.deepEqual(result, event, 'deno received event')
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
    if (err) t.end(err)
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
  invoke({ lambda, ...params }, (err, result) => {
    if (err) t.end(err)
    let { options, timeout } = execPassedParams
    t.equals(options.cwd, lambda.src, 'Default runtime passed correct path')
    t.equals(timeout, 5000, 'Default runtime ran with correct timeout')
    t.deepEqual(result, event, 'Default runtime received event')
  })
})

test('Verify call counts from runtime invocations', t => {
  t.plan(5)
  t.equals(runtimes.asap, 1, 'ASAP called correct number of times')
  t.equals(runtimes.deno, 1, 'Deno called correct number of times')
  t.equals(runtimes.node, 5, 'Node called correct number of times')
  t.equals(runtimes.python, 2, 'Python called correct number of times')
  t.equals(runtimes.ruby, 1, 'Ruby called correct number of times')
})
