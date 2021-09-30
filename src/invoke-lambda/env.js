let { join } = require('path')
let { toLogicalID } = require('@architect/utils')

// Constructs Lambda execution environment variables
module.exports = function getEnv (params) {
  let { cwd, lambda, inventory, ports, userEnv } = params
  let { config, src } = lambda
  let { inv } = inventory
  let { ARC_ENV, ARC_LOCAL, ARC_STATIC_SPA, NODE_ENV, PATH, SESSION_TABLE_NAME } = process.env
  let { AWS_ACCESS_KEY_ID, AWS_PROFILE, AWS_REGION, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN } = process.env

  // Runtime environment variables
  let env = {
    // AWS-specific
    AWS_ACCESS_KEY_ID,
    AWS_PROFILE,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY,
    AWS_SESSION_TOKEN,
    LAMBDA_TASK_ROOT: src,
    TZ: 'UTC',
    // Internal for handler bootstrap
    __ARC_CONTEXT__: JSON.stringify({}), // TODO add more stuff to Lambda req context!
    __ARC_CONFIG__: JSON.stringify({
      projectSrc: cwd,
      handlerFile: 'index',
      handlerFunction: 'handler',
      shared: inv.shared,
      views: inv.views,
    }),
    // Arc stuff
    ARC_APP_NAME: inv.app,
    ARC_ENV,
    ARC_ROLE: 'SandboxRole',
    SESSION_TABLE_NAME: SESSION_TABLE_NAME || 'jwe',
    // System
    PATH,
    NODE_ENV,
  }

  // Populate userland vars, but don't overwrite internal / system ones
  if (config.env === false) {
    env.ARC_DISABLE_ENV_VARS = true
  }
  else {
    let reserved = Object.keys(env)
    Object.entries(userEnv).forEach(([ n, v ]) => {
      if (!reserved.includes(n)) env[n] = v
    })
  }

  // Sandbox useAWS pref forces ARC_LOCAL
  if (inv._project?.preferences?.sandbox?.useAWS || ARC_LOCAL) {
    env.ARC_LOCAL = true
  }

  // The presence of ARC_CLOUDFORMATION (Arc v6+) is used by Arc libs to key on live S3 infra
  // TODO [REMOVE]: this is probably no longer necessary after dropping Arc 5 support
  let capEnv = ARC_ENV.charAt(0).toUpperCase() + ARC_ENV.substr(1)
  env.ARC_CLOUDFORMATION = `${toLogicalID(inv.app)}${capEnv}`

  // Env vars for users manually running ASAP in a Lambda
  if (inv.static) {
    env.ARC_STATIC_BUCKET = 'sandbox'
    // TODO [REMOVE]: retire ARC_SANDBOX_PATH_TO_STATIC in next breaking change in favor of ARC_STATIC_BUCKET for better local/prod symmetry
    env.ARC_SANDBOX_PATH_TO_STATIC = join(cwd, inv.static.folder)
    // Add userland ARC_STATIC_SPA if defined, otherwise we'll pick it up via Inv
    if (ARC_STATIC_SPA) {
      env.ARC_STATIC_SPA = ARC_STATIC_SPA
    }
  }

  // Add ports and URLs if defined (and not an ASAP call)
  if (inv.ws)     env.ARC_WSS_URL     = `ws://localhost:${ports.httpPort}`
  if (inv.events) env.ARC_EVENTS_PORT = ports.eventsPort
  if (inv.tables) env.ARC_TABLES_PORT = ports.tablesPort

  // Runtime stuff
  if (config.runtime.startsWith('python')) {
    env.PYTHONUNBUFFERED = true
    env.PYTHONPATH = process.env.PYTHONPATH
      ? `${join(src, 'vendor')}:${process.env.PYTHONPATH}`
      : join(src, 'vendor')
  }

  return env
}
