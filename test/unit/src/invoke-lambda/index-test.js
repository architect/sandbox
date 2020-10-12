let { join } = require('path')
let proxyquire = require('proxyquire')
let sinon = require('sinon')
let test = require('tape')
let cwd = process.cwd()
let mock = join(__dirname, '..', '..', '..', 'mock')

// let spy = sinon.spy()
let nodeFake = sinon.fake((options, request, timeout, callback) => callback(null, { options, request, timeout }))
let pythonFake = sinon.fake((options, request, timeout, callback) => callback(null, { options, request, timeout }))
let rubyFake = sinon.fake((options, request, timeout, callback) => callback(null, { options, request, timeout }))
let denoFake = sinon.fake((options, request, timeout, callback) => callback(null, { options, request, timeout }))
let invoke = proxyquire('../../../../src/invoke-lambda', {
  './run-in-node': nodeFake,
  './run-in-python': pythonFake,
  './run-in-ruby': rubyFake,
  './run-in-deno': denoFake
})

test('Set up env', t => {
  t.plan(1)
  process.chdir(join(mock, 'normal'))
  t.ok(invoke, 'Got invoke')
})

let p = e => `src/http/${e}`
let e = e => `src/events/${e}`
let event = { something: 'happened' }

test('Test runtime invocations', t => {
  t.plan(27)
  invoke(p('get-index'), event, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, p('get-index'), 'Default runtime passed correct path')
    t.equals(timeout, 5000, 'Default runtime ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'Default runtime received event')
  })

  invoke(p('get-nodejs12_x'), event, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, p('get-nodejs12_x'), 'nodejs12.x passed correct path')
    t.equals(timeout, 12000, 'nodejs12.x ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'nodejs12.x received event')
  })

  invoke(p('get-nodejs10_x'), event, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, p('get-nodejs10_x'), 'nodejs10.x passed correct path')
    t.equals(timeout, 10000, 'nodejs10.x ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'nodejs10.x received event')
  })

  invoke(p('get-nodejs8_10'), event, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, p('get-nodejs8_10'), 'nodejs8.10 passed correct path')
    t.equals(timeout, 810000, 'nodejs8.10 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'nodejs8.10 received event')
  })

  invoke(p('get-python3_8'), event, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, p('get-python3_8'), 'python3.8 passed correct path')
    t.equals(timeout, 38000, 'python3.8 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'python3.8 received event')
  })

  invoke(p('get-python3_7'), event, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, p('get-python3_7'), 'python3.7 passed correct path')
    t.equals(timeout, 37000, 'python3.7 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'python3.7 received event')
  })

  invoke(p('get-python3_6'), event, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, p('get-python3_6'), 'python3.6 passed correct path')
    t.equals(timeout, 36000, 'python3.6 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'python3.6 received event')
  })

  invoke(p('get-ruby2_5'), event, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, p('get-ruby2_5'), 'ruby2.5 passed correct path')
    t.equals(timeout, 25000, 'ruby2.5 ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'ruby2.5 received event')
  })

  invoke(p('get-deno'), event, (err, { options, request, timeout }) => {
    if (err) t.fail(err)
    t.equals(options.cwd, p('get-deno'), 'deno passed correct path')
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
  invoke(p('post-post'), { body: blobby(6000001) }, (err) => {
    t.ok(err instanceof Error, 'POST: > 6MB request bodies return an error')
    console.log(err.message)
  })
  invoke(p('post-post'), { body: blobby(10) }, (err) => {
    t.notOk(err instanceof Error, 'POST: sub 6MB request bodies are fine')
  })
  invoke(e('ping'), snsify(blobby(6000001)), (err) => {
    t.ok(err instanceof Error, 'Event: > 6MB request bodies return an error')
    console.log(err.message)
  })
  invoke(e('ping'), snsify(blobby(10)), (err) => {
    t.notOk(err instanceof Error, 'Event: sub 6MB request bodies are fine')
  })
})

test('Teardown', t => {
  t.plan(1)
  process.chdir(cwd)
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
