let { join } = require('path')
let getContext = require('./context')
let { userEnvVars } = require('../../lib')
let { version } = require('../../../package.json')

// Assemble Lambda-specific execution environment variables
module.exports = function getEnv (params, requestID) {
  let { apiType, creds, cwd, lambda, host, inventory, ports, staticPath } = params
  let { accessKeyId, secretAccessKey, sessionToken } = creds
  let { config, src, build, handlerFile } = lambda
  let { inv } = inventory
  let { AWS_PROFILE, AWS_REGION, PATH } = process.env

  let lambdaContext = getContext(params)
  let envVars = userEnvVars(params)

  let AWS_LAMBDA_RUNTIME_API = `http://${host || 'localhost'}:${ports._arc}/${requestID}`
  // Strangely, various AWS language libs exhibit different behavior relating to the presence of URI scheme
  // Use kinda brittle `includes()` here (because `go` is a reserved runtime alias for the legacy `go1.x` Lambda runtime, and Sandbox does not support it), so the Arc plugin will have to use a different, unique runtime name for now
  if (lambda.config.runtime.includes('go')) {
    AWS_LAMBDA_RUNTIME_API = AWS_LAMBDA_RUNTIME_API.replace('http://', '')
  }

  // Runtime environment variables
  let env = {
    // AWS-specific
    AWS_ACCESS_KEY_ID: accessKeyId,
    AWS_LAMBDA_FUNCTION_MEMORY_SIZE: lambda.config.memory,
    AWS_LAMBDA_FUNCTION_NAME: `@${lambda.pragma} ${lambda.name}`,
    AWS_LAMBDA_FUNCTION_VERSION: '$latest',
    AWS_LAMBDA_RUNTIME_API,
    AWS_PROFILE,
    AWS_REGION,
    AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE: true, // Sigh.
    AWS_SECRET_ACCESS_KEY: secretAccessKey,
    AWS_SESSION_TOKEN: sessionToken,
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

  // Tidy up compiled env vars
  if (config?.runtimeConfig?.type === 'compiled') {
    delete env.__ARC_CONTEXT__
    delete env.__ARC_CONFIG__
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
