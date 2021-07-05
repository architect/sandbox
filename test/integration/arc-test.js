let { join } = require('path')
let test = require('tape')
let aws = require('aws-sdk')
let http = require('http')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { shutdown } = require('./http/_utils')

let mock = join(process.cwd(), 'test', 'mock')
let port = process.env.PORT || 3333
let app = 'mockapp'
let tables = [ 'accounts', 'pets', 'places', 'data' ]

// AWS services to test
let endpoint = new aws.Endpoint(`http://localhost:${port - 1}/_arc/ssm`)
let httpOptions = { agent: new http.Agent() }
let ssm = new aws.SSM({ endpoint, region: 'us-west-2', httpOptions })

function check ({ result, type, items, t }) {
  t.equal(result.Parameters.length, items.length, 'Got correct number of params')
  items.forEach(i => {
    let key = `/${app}/${type}/${i}`
    let value = `${app}-staging-${i}`
    let found = result.Parameters.find(r => {
      return r.Name === key && r.Value === value
    })
    t.ok(found, `Found param: ${key}`)
  })
}

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got Sandbox')
})

test('Start Sandbox ("normal" mock app)', t => {
  t.plan(1)
  sandbox.start({ cwd: join(mock, 'normal'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Sandbox successfully started', 'Sandbox started')
  })
})

test('Get & check params (without specifying a type)', t => {
  t.plan(5)
  // Should get all tables params back
  ssm.getParametersByPath({ Path: `/${app}` }, function (err, result) {
    if (err) t.fail(err)
    else check({ result, type: 'tables', items: tables, t })
  })
})

test('Get & check params (specifying a type)', t => {
  t.plan(5)
  ssm.getParametersByPath({ Path: `/${app}/tables` }, function (err, result) {
    if (err) t.fail(err)
    else check({ result, type: 'tables', items: tables, t })
  })
})

test('Get & check params (specifying an invalid or unknown)', t => {
  t.plan(1)
  ssm.getParametersByPath({ Path: `/${app}/idk` }, function (err, result) {
    if (err) t.fail(err)
    else t.deepEqual(result.Parameters, [], 'No parameters returned')
  })
})

test('Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test(`Start Sandbox ('plugins-sync' mock app)`, t => {
  t.plan(1)
  sandbox.start({ cwd: join(mock, 'plugins-sync'), quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else t.equal(result, 'Sandbox successfully started', 'Sandbox started')
  })
})

test('Get & check params provided by plugin (without specifying a type)', t => {
  t.plan(3)
  // Should get all tables params back
  ssm.getParametersByPath({ Path: '/plugins-sandbox' }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.equals(result.Parameters.length, 1, 'one parameter returned')
      t.equals(result.Parameters[0].Name, '/plugins-sandbox/myplugin/varOne', 'plugin parameter name correct')
      t.equals(result.Parameters[0].Value, 'valueOne', 'plugin parameter value correct')
    }
  })
})

test('Teardown', t => {
  t.plan(2)
  shutdown(t)
  delete process.env.ARC_API_TYPE
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
})
