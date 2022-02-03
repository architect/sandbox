let { getLambdaName } = require('@architect/utils')
let { makeRequestId } = require('../../lib')

// See: https://docs.aws.amazon.com/lambda/latest/dg/ + nodejs|python|ruby + -context.html
module.exports = function createLambdaContext (params) {
  let { apiType, lambda, connectionId } = params
  let { config, method, name, path } = lambda
  let { memory, runtime } = config

  // TODO see if/how !ws invocations utilize request IDs in request context
  let awsRequestId = connectionId || makeRequestId()
  let functionName = `sandbox-${method ? `${method}${getLambdaName(path)}` : name}`
  let functionVersion = '$LATEST'
  let invokedFunctionArn = 'sandbox'

  if (runtime.startsWith('node') || runtime.startsWith('deno')) {
    let lambdaContext = {
      awsRequestId: makeRequestId(),
      functionName,
      functionVersion,
      invokedFunctionArn: 'sandbox',
      // TODO: getRemainingTimeInMillis()
    }
    if (apiType?.startsWith('http')) lambdaContext.memoryLimitInMB = memory
    else lambdaContext.mem = memory
    return lambdaContext
  }
  if (runtime.startsWith('python') || runtime.startsWith('ruby')) {
    let lambdaContext = {
      aws_request_id: awsRequestId,
      function_name: functionName,
      function_version: functionVersion,
      invoked_function_arn: invokedFunctionArn,
      memory_limit_in_mb: memory,
    }
    // TODO: get_remaining_time_in_millis()
    // TODO Ruby only: deadline_ms
    return lambdaContext
  }
  return {}

}
