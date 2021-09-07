let test = require('tape')
let proxyquire = require('proxyquire')
let { EventEmitter } = require('events')
let ssm = proxyquire('../../../../../src/arc/_ssm', {
  './_services': () => {}
})
let req
let res
let resBody
function reset (t) {
  resBody = null
  req = new EventEmitter()
  req.method = 'POST'
  res = {
    end: (body) => {
      resBody = body
      t.pass('HTTP response end invoked')
    },
    setHeader: () => {}
  }
}

test('ssm module should return 400 if request body is not JSON', t => {
  t.plan(2)
  reset(t)
  ssm({ body: '{not-json', inventory: { inv: {} } }, req, res)
  t.equals(res.statusCode, 400, 'response statusCode not set to 400')
})

test('ssm module should return JSON containing all parameters for a stack if only stack specified', t => {
  t.plan(4)
  reset(t)
  ssm({ body: '{"Path":"/myAppStaging"}', inventory: { inv: { _serviceDiscovery: {
    events: { myEvent: 'some:arn' },
    someplugin: { pluginService: 'some:other:arn' }
  } } } }, req, res)
  t.equals(res.statusCode, 200, 'response statuscode set to 200')
  let body = JSON.parse(resBody)
  t.equals(body.Parameters.find(p => p.Name === '/myAppStaging/events/myEvent').Value, 'some:arn', 'returned an events Parameter with expected name and value')
  t.equals(body.Parameters.find(p => p.Name === '/myAppStaging/someplugin/pluginService').Value, 'some:other:arn', 'returned a plugin Parameter with expected name and value')
})

test('ssm module should return JSON containing all service type-specific parameters for a stack if both stack and service are specified', t => {
  t.plan(4)
  reset(t)
  ssm({ body: '{"Path":"/myAppStaging/someplugin"}', inventory: { inv: { _serviceDiscovery: {
    events: { myEvent: 'some:arn' },
    someplugin: { pluginService: 'some:other:arn' }
  } } } }, req, res)
  t.equals(res.statusCode, 200, 'response statuscode set to 200')
  let body = JSON.parse(resBody)
  t.notOk(body.Parameters.find(p => p.Name === '/myAppStaging/events/myEvent'), 'returned zero Parameters for service type not requested')
  t.equals(body.Parameters.find(p => p.Name === '/myAppStaging/someplugin/pluginService').Value, 'some:other:arn', 'returned a plugin Parameter with expected name and value')
})
