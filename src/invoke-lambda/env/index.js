let { join } = require('path')
let getContext = require('./context')
let { userEnvVars } = require('../../lib')
let { version } = require('../../../package.json')

// Assemble Lambda-specific execution environment variables
module.exports = function getEnv (params) {
  let { apiType, cwd, lambda, inventory, ports, staticPath } = params
  let { config, src, build, handlerFile } = lambda
  let { inv } = inventory
  let { AWS_ACCESS_KEY_ID, AWS_PROFILE, AWS_REGION, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN, PATH } = process.env

  let lambdaContext = getContext(params)
  let envVars = userEnvVars(params)

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
    // Arc + userland
    ...envVars,
    ARC_SANDBOX: JSON.stringify({
      apiType,
      cwd,
      ports,
      staticPath,
      version,
      lambdaSrc: src,
      lambdaBuild: build,
    }),
    // System
    PATH,
  }

  // Runtime stuff
  if (config.runtime.startsWith('python')) {
    env.PYTHONUNBUFFERED = true
    env.PYTHONPATH = process.env.PYTHONPATH
      ? `${join(src, 'vendor')}:${process.env.PYTHONPATH}`
      : join(src, 'vendor')
  }

  return env
}
