let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { run, startup, shutdown, url } = require('../utils')

let systemEnvVars = [ 'LAMBDA_TASK_ROOT', 'TZ', 'ARC_APP_NAME', 'ARC_ENV', 'ARC_ROLE', 'ARC_SANDBOX', 'SESSION_TABLE_NAME', 'PATH' ]
let shouldBeFiltered = [
  '__ARC_CONTEXT__', '__ARC_CONFIG__'
]
function checkSystemEnvVars (env, t) {
  systemEnvVars.forEach(v => {
    if (!env[v]) t.fail(`Lambda env missing system environment variable: ${v}`)
    if (v === 'ARC_SANDBOX') {
      let sandboxMeta = JSON.parse(env[v])
      let props = [ 'apiType', 'cwd', 'ports', 'staticPath', 'version' ]
      props.forEach(p => {
        let prop = sandboxMeta[p]
        if (!prop) t.fail(`Lambda env missing Sandbox meta environment variable property: ${v}.${p}`)
        if (p === 'ports' && (!prop.httpPort || !prop.eventsPort || !prop.tablesPort || !prop._arcPort)) {
          t.fail(`Lambda env Sandbox meta environment variable does not have all Sandbox ports: ${JSON.stringify(prop, null, 2)}`)
        }
      })
    }
  })
  shouldBeFiltered.forEach(v => {
    if (env[v]) t.fail(`Lambda env includes environment variable that should not be present: ${v}`)
  })
  t.notOk(env.__TESTING_ENV_VAR__, 'No system env var pollution')
}

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Got Sandbox')
})

test('Run misc HTTP tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  t.test(`[Env vars (.env) / ${runType}] Start Sandbox`, t => {
    process.env.__TESTING_ENV_VAR__ = 'henlo'
    startup[runType](t, join('env', 'dot-env'))
  })

  t.test(`[Env vars (.env) / ${runType}] get /`, t => {
    t.plan(3)
    tiny.get({ url }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkSystemEnvVars(result.body, t)
        t.equal(result.body.DOTENV_USERLAND_ENV_VAR, 'Why hello there from .env!', 'Received userland env var')
        t.equal(result.body.dotenv_lowcase_env_var, 'Why hello there from .env!', 'Received userland env var')
      }
    })
  })

  t.test(`[Env vars (.env) / ${runType}] Shut down Sandbox`, t => {
    delete process.env.__TESTING_ENV_VAR__
    shutdown[runType](t)
  })

  if (runType === 'module') {
    t.test(`[Env vars (env option) / ${runType}] Start Sandbox`, t => {
      process.env.__TESTING_ENV_VAR__ = 'henlo'
      startup[runType](t, join('env', 'dot-env'), {
        env: {
          DOTENV_USERLAND_ENV_VAR: 'Why hello there from overridden .env!',
          ENV_OPTION_USERLAND_ENV_VAR: 'Why hello there from env option!',
        }
      })
    })

    t.test(`[Env vars (env option) / ${runType}] get /`, t => {
      t.plan(4)
      tiny.get({ url }, function _got (err, result) {
        if (err) t.fail(err)
        else {
          checkSystemEnvVars(result.body, t)
          t.equal(result.body.DOTENV_USERLAND_ENV_VAR, 'Why hello there from overridden .env!', 'Received userland env var')
          t.equal(result.body.ENV_OPTION_USERLAND_ENV_VAR, 'Why hello there from env option!', 'Received userland env var')
          t.notOk(result.body.dotenv_lowcase_env_var, 'Did not receive .env env var')
        }
      })
    })

    t.test(`[Env vars (env option) / ${runType}] Shut down Sandbox`, t => {
      delete process.env.__TESTING_ENV_VAR__
      shutdown[runType](t)
    })
  }

  t.test(`[Env vars (preferences.arc) / ${runType}] Start Sandbox`, t => {
    process.env.__TESTING_ENV_VAR__ = 'henlo'
    startup[runType](t, join('env', 'preferences'))
  })

  t.test(`[Env vars (preferences.arc) / ${runType}] get /`, t => {
    t.plan(3)
    tiny.get({ url }, function _got (err, result) {
      if (err) t.fail(err)
      else {
        checkSystemEnvVars(result.body, t)
        t.equal(result.body.PREFERENCES_DOT_ARC_USERLAND_ENV_VAR, 'Why hello there from preferences.arc!', 'Received userland env var')
        t.equal(result.body.preferences_dot_arc_lowcase_env_var, 'Why hello there from preferences.arc!', 'Received userland env var')
      }
    })
  })

  t.test(`[Env vars (preferences.arc) / ${runType}] Shut down Sandbox`, t => {
    delete process.env.__TESTING_ENV_VAR__
    shutdown[runType](t)
  })
}
