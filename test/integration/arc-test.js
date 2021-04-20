let { join } = require('path')
let test = require('tape')
let aws = require('aws-sdk')
let http = require('http')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { shutdown } = require('./http/_utils')

let mock = join(__dirname, '..', 'mock')
let port = process.env.PORT || 3333
let cwd = process.cwd()
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

test('Start Sandbox', t => {
  t.plan(1)
  process.chdir(join(mock, 'normal'))
  sandbox.start({ quiet: true }, function (err, result) {
    if (err) t.fail(err)
    else {
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
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

test('[Dependency warnings] Teardown', t => {
  t.plan(3)
  shutdown(t)
  delete process.env.ARC_API_TYPE
  process.chdir(cwd)
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
