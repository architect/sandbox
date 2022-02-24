let { join } = require('path')
let test = require('tape')
let aws = require('aws-sdk')
let http = require('http')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { credentials, run, startup, shutdown } = require('../../utils')
let _arcPort = 2222

let app = 'mockapp'
let tables = [ 'accounts', 'pets', 'places', 'data' ]

// AWS services to test
let endpoint = new aws.Endpoint(`http://localhost:${_arcPort}/_arc/ssm`)
let httpOptions = { agent: new http.Agent() }
let ssm = new aws.SSM({ endpoint, region: 'us-west-2', httpOptions, credentials })

function check ({ result, type, items, t }) {
  let internal = result.Parameters?.[0]?.Name?.includes('ARC_SANDBOX') ? 1 : 0
  t.equal(result.Parameters.length - internal, items.length, 'Got correct number of params')
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

test('Run internal Arc SSM service tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  let mode = `[Internal Arc SSM services / ${runType}]`

  t.test(`${mode} Start Sandbox ('normal' mock app)`, t => {
    startup[runType](t, 'normal')
  })

  t.test(`${mode} Get & check params (without specifying a type)`, t => {
    t.plan(5)
    // Should get all tables params back
    ssm.getParametersByPath({ Path: `/${app}` }, function (err, result) {
      if (err) t.fail(err)
      else check({ result, type: 'tables', items: tables, t })
    })
  })

  t.test(`${mode} Get & check params (specifying a type)`, t => {
    t.plan(5)
    ssm.getParametersByPath({ Path: `/${app}/tables` }, function (err, result) {
      if (err) t.fail(err)
      else check({ result, type: 'tables', items: tables, t })
    })
  })

  t.test(`${mode} Get & check params (specifying an invalid or unknown)`, t => {
    t.plan(1)
    ssm.getParametersByPath({ Path: `/${app}/idk` }, function (err, result) {
      if (err) t.fail(err)
      else t.deepEqual(result.Parameters, [], 'No parameters returned')
    })
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  t.test(`${mode} Start Sandbox ('plugins-sync' mock app)`, t => {
    startup[runType](t, 'plugins-sync')
  })

  t.test(`${mode} Get & check params provided by plugin (without specifying a type)`, t => {
    t.plan(5)
    // Should get all tables params back
    ssm.getParametersByPath({ Path: '/plugins-sandbox' }, function (err, result) {
      if (err) t.fail(err)
      else {
        t.equal(result.Parameters.length, 2, 'One parameter returned')
        t.equal(result.Parameters[0].Name, '/plugins-sandbox/ARC_SANDBOX/ports', 'Plugin parameter name correct')
        t.match(result.Parameters[0].Value, /\"_arc\":/, 'Plugin parameter value correct')
        t.equal(result.Parameters[1].Name, '/plugins-sandbox/myplugin/varOne', 'Plugin parameter name correct')
        t.equal(result.Parameters[1].Value, 'valueOne', 'Plugin parameter value correct')
      }
    })
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
