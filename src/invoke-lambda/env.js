let { join } = require('path')
let { readFileSync } = require('fs')
let getContext = require('./context')
let { version } = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json')))

// Constructs Lambda execution environment variables
module.exports = function getEnv (params) {
  let { apiType, cwd, lambda, inventory, ports, staticPath, userEnv } = params
  let { config, src, build, handlerFile } = lambda
  let { inv } = inventory
  let { ARC_ENV, ARC_LOCAL, ARC_STATIC_SPA, PATH, ARC_SESSION_TABLE_NAME, SESSION_TABLE_NAME } = process.env
  let { AWS_ACCESS_KEY_ID, AWS_PROFILE, AWS_REGION, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN } = process.env

  let lambdaContext = getContext(params)

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
    __ARC_CONTEXT__: JSON.stringify(lambdaContext),
    __ARC_CONFIG__: JSON.stringify({
      projectSrc: cwd,
      handlerFile,
      handlerMethod: 'handler',
      shared: inv.shared,
      views: inv.views,
    }),
    // Arc stuff
    ARC_APP_NAME: inv.app,
    ARC_ENV,
    ARC_ROLE: 'SandboxRole',
    ARC_SANDBOX: JSON.stringify({
      apiType,
      cwd,
      ports,
      staticPath,
      version,
      lambdaSrc: src,
      lambdaBuild: build,
    }),
    ARC_SESSION_TABLE_NAME: ARC_SESSION_TABLE_NAME || SESSION_TABLE_NAME || 'jwe',
    // System
    PATH,
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

  // Add URL(s) if defined
  if (inv.ws)     env.ARC_WSS_URL     = `ws://localhost:${ports.http}`

  // Runtime stuff
  if (config.runtime.startsWith('python')) {
    env.PYTHONUNBUFFERED = true
    env.PYTHONPATH = process.env.PYTHONPATH
      ? `${join(src, 'vendor')}:${process.env.PYTHONPATH}`
      : join(src, 'vendor')
  }

  return env
}
