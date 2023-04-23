require('aws-sdk/lib/maintenance_mode_message').suppress = true
let { join } = require('path')
let test = require('tape')
let aws = require('aws-sdk')
let http = require('http')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { credentials, run, startup, shutdown } = require('../../utils')
let _arcPort = 2222

let app = 'MockappTesting'
let tables = [ 'accounts', 'pets', 'places', 'data' ]

// AWS services to test
let endpoint = new aws.Endpoint(`http://localhost:${_arcPort}/_arc/ssm`)
let httpOptions = { agent: new http.Agent() }
let ssm = new aws.SSM({ endpoint, region: 'us-west-2', httpOptions, credentials })

function check ({ result, type, items, fallback, t }) {
  let internal = result.Parameters?.[0]?.Name?.includes('ARC_SANDBOX') ? 1 : 0
  t.equal(result.Parameters.length - internal, items.length, 'Got correct number of params')
  items.forEach(i => {
    let stack = fallback ? 'ArcAppTesting' : app
    let key = `/${stack}/${type}/${i}`
    let value = `mockapp-staging-${i}`
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

  /**
   * ssm.getParametersByPath()
   */
  t.test(`${mode} Get & check params (without specifying a type)`, t => {
    t.plan(6)
    // Should get all tables params back
    ssm.getParametersByPath({ Path: `/${app}` }, function (err, result) {
      if (err) t.end(err)
      else {
        t.equal(result.Parameters.length, 5, 'Got back correct number of params')
        check({ result, type: 'tables', items: tables, t })
      }
    })
  })

  t.test(`${mode} Get & check params (without specifying a type; Arc Functions bare module mode)`, t => {
    t.plan(6)
    // Should get all tables params back
    ssm.getParametersByPath({ Path: `/ArcAppTesting` }, function (err, result) {
      if (err) t.end(err)
      else {
        t.equal(result.Parameters.length, 5, 'Got back correct number of params')
        check({ result, type: 'tables', items: tables, fallback: true, t })
      }
    })
  })

  t.test(`${mode} Get & check params (specifying a type)`, t => {
    t.plan(6)
    ssm.getParametersByPath({ Path: `/${app}/tables` }, function (err, result) {
      if (err) t.end(err)
      else {
        t.equal(result.Parameters.length, 4, 'Got back correct number of params')
        check({ result, type: 'tables', items: tables, t })
      }
    })
  })

  t.test(`${mode} Get & check params (specifying a type; Arc Functions bare module mode)`, t => {
    t.plan(6)
    ssm.getParametersByPath({ Path: `/ArcAppTesting/tables` }, function (err, result) {
      if (err) t.end(err)
      else {
        t.equal(result.Parameters.length, 4, 'Got back correct number of params')
        check({ result, type: 'tables', items: tables, fallback: true, t })
      }
    })
  })

  t.test(`${mode} Get & check params (specifying an invalid or unknown service)`, t => {
    t.plan(1)
    ssm.getParametersByPath({ Path: `/${app}/idk` }, function (err, result) {
      if (err) t.end(err)
      else t.deepEqual(result.Parameters, [], 'No parameters returned')
    })
  })

  t.test(`${mode} Get & check params (specifying an invalid or unknown service; Arc Functions bare module mode)`, t => {
    t.plan(1)
    ssm.getParametersByPath({ Path: `/ArcAppTesting/idk` }, function (err, result) {
      if (err) t.end(err)
      else t.deepEqual(result.Parameters, [], 'No parameters returned')
    })
  })

  t.test(`${mode} Get & check params (specifying an invalid or unknown app)`, t => {
    t.plan(1)
    ssm.getParametersByPath({ Path: `/idk` }, function (err, result) {
      if (err) t.end(err)
      else t.deepEqual(result.Parameters, [], 'No parameters returned')
    })
  })

  t.test(`${mode} Get & check params (specifying an unknown app + known service)`, t => {
    t.plan(1)
    ssm.getParametersByPath({ Path: `/idk/tables` }, function (err, result) {
      if (err) t.end(err)
      else t.deepEqual(result.Parameters, [], 'No parameters returned')
    })
  })

  /**
   * ssm.getParameter()
   */
  t.test(`${mode} Get & check a param`, t => {
    t.plan(1)
    let key = `/${app}/tables/accounts`
    ssm.getParameter({ Name: key }, function (err, result) {
      if (err) t.end(err)
      else {
        let { Name, Value } = result.Parameter
        if (Name === key && Value === `mockapp-staging-accounts`) {
          t.pass(`Found param: ${key}`)
        }
        else t.end(`Could not find param: ${key}`)
      }
    })
  })

  t.test(`${mode} Get & check a param (Arc Functions bare module mode)`, t => {
    t.plan(1)
    let key = `/ArcAppTesting/tables/accounts`
    ssm.getParameter({ Name: key }, function (err, result) {
      if (err) t.end(err)
      else {
        let { Name, Value } = result.Parameter
        if (Name === key && Value === `mockapp-staging-accounts`) {
          t.pass(`Found param: ${key}`)
        }
        else t.end(`Could not find param: ${key}`)
      }
    })
  })

  t.test(`${mode} Getting a param without specifying a service type should fail`, t => {
    t.plan(2)
    let key = `/${app}`
    ssm.getParameter({ Name: key }, function (err) {
      if (!err) t.fail('Expected error')
      else {
        t.match(err.name, /ParameterNotFound/, 'Got ParameterNotFound error')
        t.equal(err.message, null, 'Returned null value')
      }
    })
  })

  t.test(`${mode} Getting a param without specifying a param should fail`, t => {
    t.plan(2)
    let key = `/${app}/tables/idk`
    ssm.getParameter({ Name: key }, function (err) {
      if (!err) t.fail('Expected error')
      else {
        t.match(err.name, /ParameterNotFound/, 'Got ParameterNotFound error')
        t.equal(err.message, null, 'Returned null value')
      }
    })
  })

  t.test(`${mode} Getting a param without specifying a param should fail (trailing slash)`, t => {
    t.plan(2)
    let key = `/${app}/tables/`
    ssm.getParameter({ Name: key }, function (err) {
      if (!err) t.fail('Expected error')
      else {
        t.match(err.name, /ValidationException/, 'Got ValidationException error')
        t.match(err.message, /Parameter cannot end in \'\/\'/, 'Errored on trailing slash')
      }
    })
  })

  /**
   * Fail on unsupported ssm methods
   */
  t.test(`${mode} Get & check params (without specifying a type)`, t => {
    t.plan(2)
    ssm.getParameters({ Names: [ 'a', 'b' ] }, function (err) {
      if (!err) t.fail('Expected error')
      else {
        t.match(err.name, /InternalServerError/, 'Got InternalServerError error')
        t.match(err.message, /Unrecognized request, Sandbox only supports/, 'Tried to provide a helpful error')
      }
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
    ssm.getParametersByPath({ Path: '/PluginsSandboxTesting' }, function (err, result) {
      if (err) t.end(err)
      else {
        t.equal(result.Parameters.length, 2, 'One parameter returned')
        t.equal(result.Parameters[0].Name, '/PluginsSandboxTesting/ARC_SANDBOX/ports', 'Plugin parameter name correct')
        t.match(result.Parameters[0].Value, /\"_arc\":/, 'Plugin parameter value correct')
        t.equal(result.Parameters[1].Name, '/PluginsSandboxTesting/myplugin/varOne', 'Plugin parameter name correct')
        t.equal(result.Parameters[1].Value, 'valueOne', 'Plugin parameter value correct')
      }
    })
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
