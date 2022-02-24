let { join } = require('path')
let { version } = require('../../package.json')

// Assemble Architect + userland env vars
module.exports = function userEnvVars (params) {
  let { cwd, env: envOption, inventory, lambda, ports } = params
  let { inv } = inventory
  let { ARC_ENV, ARC_LOCAL, ARC_STATIC_SPA, ARC_SESSION_TABLE_NAME, SESSION_TABLE_NAME } = process.env

  let env = {
    ARC_APP_NAME: inv.app,
    ARC_ENV,
    ARC_ROLE: 'SandboxRole',
    ARC_SANDBOX: JSON.stringify({ cwd, ports, version }),
    ARC_SESSION_TABLE_NAME: ARC_SESSION_TABLE_NAME || SESSION_TABLE_NAME || 'jwe',
  }

  // Sandbox useAWS pref forces ARC_LOCAL
  if (inv._project?.preferences?.sandbox?.useAWS || ARC_LOCAL) {
    env.ARC_LOCAL = true
  }

  // Env vars for users manually running ASAP in a Lambda
  if (inv.static) {
    env.ARC_STATIC_BUCKET = join(cwd || inv._project.cwd, inv.static.folder)
    // Add userland ARC_STATIC_SPA if defined, otherwise we'll pick it up via Inv
    if (ARC_STATIC_SPA) {
      env.ARC_STATIC_SPA = ARC_STATIC_SPA
    }
  }

  // Add URL(s) if defined
  if (inv.ws) {
    env.ARC_WSS_URL = `ws://localhost:${ports.http}`
  }

  // Populate userland vars, but don't overwrite internal / system ones
  if (lambda?.config?.env === false) {
    env.ARC_DISABLE_ENV_VARS = true
  }
  else {
    let userEnv = envOption || inv._project.env.local?.[ARC_ENV]
    if (userEnv) {
      let reserved = Object.keys(env)
      Object.entries(userEnv).forEach(([ n, v ]) => {
        if (!reserved.includes(n)) env[n] = v
      })
    }
  }

  return env
}
