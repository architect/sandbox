let { join } = require('path')
let test = require('tape')
let awsLite = require('@aws-lite/client')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { credentials, run, startup, shutdown } = require('../../utils')
let _arcPort = 2222

let app = 'MockappTesting'
let tables = [ 'accounts', 'pets', 'places', 'data' ]
let ssm

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

test('Set up env', async t => {
  t.plan(2)
  t.ok(sandbox, 'Got Sandbox')
  let aws = await awsLite({
    ...credentials,
    endpoint: `http://localhost:${_arcPort}/_arc/ssm`,
    region: 'us-west-2',
  })
  ssm = aws.SSM
  t.ok(ssm, 'Populated SSM client')
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
  t.test(`${mode} Get & check params (without specifying a type)`, async t => {
    t.plan(6)
    // Should get all tables params back
    let result = await ssm.GetParametersByPath({ Path: `/${app}` })
    t.equal(result.Parameters.length, 5, 'Got back correct number of params')
    check({ result, type: 'tables', items: tables, t })
  })

  t.test(`${mode} Get & check params (without specifying a type; Arc Functions bare module mode)`, async t => {
    t.plan(6)
    // Should get all tables params back
    let result = await ssm.GetParametersByPath({ Path: `/ArcAppTesting` })
    t.equal(result.Parameters.length, 5, 'Got back correct number of params')
    check({ result, type: 'tables', items: tables, fallback: true, t })
  })

  t.test(`${mode} Get & check params (specifying a type)`, async t => {
    t.plan(6)
    let result = await ssm.GetParametersByPath({ Path: `/${app}/tables` })
    t.equal(result.Parameters.length, 4, 'Got back correct number of params')
    check({ result, type: 'tables', items: tables, t })
  })

  t.test(`${mode} Get & check params (specifying a type; Arc Functions bare module mode)`, async t => {
    t.plan(6)
    let result = await ssm.GetParametersByPath({ Path: `/ArcAppTesting/tables` })
    check({ result, type: 'tables', items: tables, fallback: true, t })
    t.equal(result.Parameters.length, 4, 'Got back correct number of params')
  })

  t.test(`${mode} Get & check params (specifying an invalid or unknown service)`, async t => {
    t.plan(1)
    let result = await ssm.GetParametersByPath({ Path: `/${app}/idk` })
    t.deepEqual(result.Parameters, [], 'No parameters returned')
  })

  t.test(`${mode} Get & check params (specifying an invalid or unknown service; Arc Functions bare module mode)`, async t => {
    t.plan(1)
    let result = await ssm.GetParametersByPath({ Path: `/ArcAppTesting/idk` })
    t.deepEqual(result.Parameters, [], 'No parameters returned')
  })

  t.test(`${mode} Get & check params (specifying an invalid or unknown app)`, async t => {
    t.plan(1)
    let result = await ssm.GetParametersByPath({ Path: `/idk` })
    t.deepEqual(result.Parameters, [], 'No parameters returned')
  })

  t.test(`${mode} Get & check params (specifying an unknown app + known service)`, async t => {
    t.plan(1)
    let result = await ssm.GetParametersByPath({ Path: `/idk/tables` })
    t.deepEqual(result.Parameters, [], 'No parameters returned')
  })

  /**
   * ssm.getParameter()
   */
  t.test(`${mode} Get & check a param`, async t => {
    t.plan(1)
    let key = `/${app}/tables/accounts`
    let result = await ssm.GetParameter({ Name: key })
    let { Name, Value } = result.Parameter
    if (Name === key && Value === `mockapp-staging-accounts`) {
      t.pass(`Found param: ${key}`)
    }
    else t.end(`Could not find param: ${key}`)
  })

  t.test(`${mode} Get & check a param (Arc Functions bare module mode)`, async t => {
    t.plan(1)
    let key = `/ArcAppTesting/tables/accounts`
    let result = await ssm.GetParameter({ Name: key })
    let { Name, Value } = result.Parameter
    if (Name === key && Value === `mockapp-staging-accounts`) {
      t.pass(`Found param: ${key}`)
    }
    else t.end(`Could not find param: ${key}`)
  })

  t.test(`${mode} Getting a param without specifying a service type should fail`, async t => {
    t.plan(1)
    let key = `/${app}`
    try {
      await ssm.GetParameter({ Name: key })
      t.fail('Expected an error')
    }
    catch (err) {
      t.match(err.__type, /ParameterNotFound/, 'Got ParameterNotFound error')
    }
  })

  t.test(`${mode} Getting a param without specifying a param should fail`, async t => {
    t.plan(1)
    let key = `/${app}/tables/idk`
    try {
      await ssm.GetParameter({ Name: key })
      t.fail('Expected an error')
    }
    catch (err) {
      t.match(err.__type, /ParameterNotFound/, 'Got ParameterNotFound error')
    }
  })

  t.test(`${mode} Getting a param without specifying a param should fail (trailing slash)`, async t => {
    t.plan(2)
    let key = `/${app}/tables/`
    try {
      await ssm.GetParameter({ Name: key })
      t.fail('Expected an error')
    }
    catch (err) {
      t.match(err.__type, /ValidationException/, 'Got ValidationException error')
      t.match(err.message, /Parameter cannot end in \'\/\'/, 'Errored on trailing slash')
    }
  })

  /**
   * Fail on unsupported ssm methods
   */
  t.test(`${mode} Get & check params (without specifying a type)`, async t => {
    t.plan(1)
    try {
      await ssm.GetParameters({ Names: [ 'a', 'b' ] })
      t.fail('Expected an error')
    }
    catch (err) {
      t.match(err.message, /Unrecognized request, Sandbox only supports/, 'Tried to provide a helpful error')
    }
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })

  t.test(`${mode} Start Sandbox ('plugins-sync' mock app)`, t => {
    startup[runType](t, 'plugins-sync')
  })

  t.test(`${mode} Get & check params provided by plugin (without specifying a type)`, async t => {
    t.plan(5)
    // Should get all tables params back
    let result = await ssm.GetParametersByPath({ Path: '/PluginsSandboxTesting' })
    t.equal(result.Parameters.length, 2, 'One parameter returned')
    t.equal(result.Parameters[0].Name, '/PluginsSandboxTesting/ARC_SANDBOX/ports', 'Plugin parameter name correct')
    t.match(result.Parameters[0].Value, /\"_arc\":/, 'Plugin parameter value correct')
    t.equal(result.Parameters[1].Name, '/PluginsSandboxTesting/myplugin/varOne', 'Plugin parameter name correct')
    t.equal(result.Parameters[1].Value, 'valueOne', 'Plugin parameter value correct')
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
