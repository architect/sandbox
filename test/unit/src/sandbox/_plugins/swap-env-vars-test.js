let { join } = require('path')
let sut = join(process.cwd(), 'src', 'sandbox', '_plugins', 'swap-env-vars')
let swapEnvVars = require(sut)
let test = require('tape')

test('Set up env', t => {
  t.plan(1)
  t.ok(swapEnvVars, 'Env var swap module is present')
})

test('Swap + restore env vars without conflict', t => {
  t.plan(2)
  let systemEnv = JSON.parse(JSON.stringify(process.env))

  let AN_EXISTING_ENV_VAR = 'ok'
  process.env.AN_EXISTING_ENV_VAR = AN_EXISTING_ENV_VAR
  let newEnv = { henlo_there: 'friends' }
  let s = swapEnvVars(newEnv)
  s.swap()
  t.deepEqual({ ...process.env, AN_EXISTING_ENV_VAR }, { ...systemEnv, ...newEnv, AN_EXISTING_ENV_VAR }, 'Swapped in env vars')

  delete process.env.AN_EXISTING_ENV_VAR
  s.restore()
  t.deepEqual({ ...process.env }, { ...systemEnv }, 'Restored env vars')
})

test('Swap + restore env vars with conflict', t => {
  t.plan(2)
  let systemEnv = JSON.parse(JSON.stringify(process.env))

  let henlo_there = 'ok'
  process.env.henlo_there = henlo_there
  let newEnv = { henlo_there: 'friends' }
  let s = swapEnvVars(newEnv)
  s.swap()
  t.deepEqual({ ...process.env, ...newEnv }, { ...systemEnv, ...newEnv }, 'Swapped in env vars')

  s.restore()
  t.deepEqual({ ...process.env, henlo_there }, { ...systemEnv, henlo_there }, 'Restored env vars')
  delete process.env.henlo_there
})
