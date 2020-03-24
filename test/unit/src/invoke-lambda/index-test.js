let path = require('path')
let proxyquire = require('proxyquire')
let sinon = require('sinon')
let test = require('tape')
let cwd = process.cwd()

// let spy = sinon.spy()
let nodeFake = sinon.fake((opts, request, to, callback) => callback(opts, request, to))
let pythonFake = sinon.fake((opts, request, to, callback) => callback(opts, request, to))
let rubyFake = sinon.fake((opts, request, to, callback) => callback(opts, request, to))
// let denoFake = sinon.fake((opts, request, to, callback) => callback(opts, request, to))
let invoke = proxyquire('../../../../src/invoke-lambda', {
  './run-in-node': nodeFake,
  './run-in-python': pythonFake,
  './run-in-ruby': rubyFake,
  // './run-in-deno': denoFake
})

test('Set up env', t => {
  t.plan(1)
  process.chdir(path.join(__dirname, '..', '..', '..', 'mock', 'normal'))
  t.ok(invoke, 'Got invoke')
})

let p = e => `src/http/${e}`
let event = {something:'happened'}

test('Test runtime invocations', t => {
  t.plan(24)
  invoke(p('get-index'), event, (options, request, timeout) => {
    t.equals(options.cwd, p('get-index'), 'Passed correct path')
    t.equals(timeout, 5000, 'Ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'Default runtime received event')
  })

  invoke(p('get-nodejs12_x'), event, (options, request, timeout) => {
    t.equals(options.cwd, p('get-nodejs12_x'), 'Passed correct path')
    t.equals(timeout, 12000, 'Ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'nodejs12.x received event')
  })

  invoke(p('get-nodejs10_x'), event, (options, request, timeout) => {
    t.equals(options.cwd, p('get-nodejs10_x'), 'Passed correct path')
    t.equals(timeout, 10000, 'Ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'nodejs10.x received event')
  })

  invoke(p('get-nodejs8_10'), event, (options, request, timeout) => {
    t.equals(options.cwd, p('get-nodejs8_10'), 'Passed correct path')
    t.equals(timeout, 810000, 'Ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'nodejs8.10 received event')
  })

  invoke(p('get-python3_8'), event, (options, request, timeout) => {
    t.equals(options.cwd, p('get-python3_8'), 'Passed correct path')
    t.equals(timeout, 38000, 'Ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'python3.8 received event')
  })

  invoke(p('get-python3_7'), event, (options, request, timeout) => {
    t.equals(options.cwd, p('get-python3_7'), 'Passed correct path')
    t.equals(timeout, 37000, 'Ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'python3.7 received event')
  })

  invoke(p('get-python3_6'), event, (options, request, timeout) => {
    t.equals(options.cwd, p('get-python3_6'), 'Passed correct path')
    t.equals(timeout, 36000, 'Ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'python3.6 received event')
  })

  invoke(p('get-ruby2_5'), event, (options, request, timeout) => {
    t.equals(options.cwd, p('get-ruby2_5'), 'Passed correct path')
    t.equals(timeout, 25000, 'Ran with correct timeout')
    t.equals(request, JSON.stringify(event), 'ruby2.5 received event')
  })
  // invoke(p('deno'), event, (options, request, timeout) => {
  //   t.equals(options.cwd, p('deno'), 'Passed correct path')
  //   t.equals(timeout, 25000, 'Ran with correct timeout')
  //   t.equals(request, JSON.stringify(event), 'ruby2.5 received event')
  // })
})

test('Verify call counts', t => {
  t.plan(3)
  t.equals(nodeFake.callCount, 4, 'Node called correct number of times')
  t.equals(pythonFake.callCount, 3, 'Python called correct number of times')
  t.equals(rubyFake.callCount, 1, 'Ruby called correct number of times')
})

test('Teardown', t => {
  t.plan(1)
  process.chdir(cwd)
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
