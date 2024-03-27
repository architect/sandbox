let test = require('tape')
let { updater } = require('@architect/utils')
let { EventEmitter } = require('events')
let ssm = require('../../../../../src/arc/_ssm')
let req
let res
let resBody
let update = updater('Sandbox tests ')
let params = { inventory: { inv: { app: 'my-app' } }, update }
function reset (t) {
  resBody = null
  req = new EventEmitter()
  req.method = 'POST'
  req.headers = { 'x-amz-target': 'AmazonSSM.GetParametersByPath' }
  res = {
    end: (body) => {
      resBody = body
      t.pass('HTTP response end invoked')
    },
    setHeader: () => {},
  }
}

test('Set up env', t => {
  process.env.ARC_ENV = 'testing'
  t.end()
})

test('ssm module should return 400 if request body is not JSON', t => {
  t.plan(2)
  reset(t)
  ssm({ body: '{not-json' }, params, req, res)
  t.equals(res.statusCode, 400, 'response statusCode not set to 400')
})

test('ssm module should return JSON containing all parameters for a stack if only stack specified', t => {
  t.plan(4)
  reset(t)
  ssm({
    body: '{"Path":"/MyAppTesting"}',
    services: {
      tables: { 'my-table': 'my-app-staging-my-table' },
      someplugin: { pluginService: 'some:other:arn' },
    },
  }, params, req, res)
  t.equals(res.statusCode, 200, 'response statuscode set to 200')
  let body = JSON.parse(resBody)
  t.equals(body.Parameters.find(p => p.Name === '/MyAppTesting/tables/my-table').Value, 'my-app-staging-my-table', 'returned an events Parameter with expected name and value')
  t.equals(body.Parameters.find(p => p.Name === '/MyAppTesting/someplugin/pluginService').Value, 'some:other:arn', 'returned a plugin Parameter with expected name and value')
})

test('ssm module should return JSON containing all service type-specific parameters for a stack if both stack and service are specified', t => {
  t.plan(4)
  reset(t)
  ssm({
    body: '{"Path":"/MyAppTesting/someplugin"}',
    services: {
      tables: { 'my-table': 'my-app-staging-my-table' },
      someplugin: { pluginService: 'some:other:arn' },
    },
  }, params, req, res)
  t.equals(res.statusCode, 200, 'response statuscode set to 200')
  let body = JSON.parse(resBody)
  t.notOk(body.Parameters.find(p => p.Name === '/MyAppTesting/tables/my-table'), 'returned zero Parameters for service type not requested')
  t.equals(body.Parameters.find(p => p.Name === '/MyAppTesting/someplugin/pluginService').Value, 'some:other:arn', 'returned a plugin Parameter with expected name and value')
})

test('Teardown', t => {
  delete process.env.ARC_ENV
  t.end()
})
