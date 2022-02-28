let { toLogicalID } = require('@architect/utils')

module.exports = function _ssm ({ body, services }, params, req, res) {
  let { inventory, update } = params
  let { app } = inventory.inv
  let env = process.env.ARC_ENV

  if (req.method !== 'POST') {
    res.statusCode = 404
    res.end()
    return
  }

  let error
  try {
    let message = JSON.parse(body)
    let param, path, requestMethod, stack, serviceType

    let exit = (__type, message = null) => {
      error = { __type, message }
      throw Error()
    }

    let sdkMethod = req.headers['x-amz-target']
    if (sdkMethod === 'AmazonSSM.GetParametersByPath') {
      requestMethod = 'getParametersByPath'
      path = message.Path
      if (!path) {
        exit('MissingRequiredParameter', `Missing required key 'Path' in params`)
      }
    }
    if (sdkMethod === 'AmazonSSM.GetParameter') {
      requestMethod = 'getParameter'
      path = message.Name
      if (!path) {
        exit('MissingRequiredParameter', `Missing required key 'Name' in params`)
      }
    }
    if (!requestMethod) {
      exit('InternalServerError', `Unrecognized request, Sandbox only supports 'getParameter', 'getParametersByPath'`)
    }

    let parts = path.split('/').filter(Boolean)
    stack = parts[0]        // CloudFormation stack name
    serviceType = parts[1]  // Service type being requested
    param = parts[2]        // Param being requested

    // Arc functions has a fallback to 'arc-app' when run as a bare module
    let unknownApp = stack !== toLogicalID(`${app}-${env}`) &&
                     stack !== toLogicalID(`arc-app-${env}`)

    // Set up default response
    res.statusCode = 200
    res.setHeader('content-type', 'application/json')

    let getParam = (param, Value, type) => ({
      Name: `/${stack}/${type || serviceType}/${param}`,
      Type: 'String',
      Value,
      Version: 1,
      LastModifiedDate: new Date().toISOString(),
      ARN: 'Architect Sandbox'
    })

    // ssm.getParametersByPath()
    if (requestMethod === 'getParametersByPath') {
      // SSM returns empty object if we can't find the app, service, or if a specific parameter is requested
      if (unknownApp || (serviceType && !services[serviceType]) || param) {
        res.end(JSON.stringify({ Parameters: [] }))
        return
      }
      // Enumerate a single service
      if (serviceType) {
        let Parameters = Object.entries(services[serviceType]).map(([ p, v ]) => getParam(p, v))
        res.end(JSON.stringify({ Parameters }))
        return
      }
      // Enumerate all services
      else {
        let Parameters = []
        Object.entries(services).forEach(([ type, service ]) => {
          Object.entries(service).map(([ p, v ]) => Parameters.push(getParam(p, v, type)))
        })
        res.end(JSON.stringify({ Parameters }))
        return
      }
    }
    // ssm.getParameter()
    else {
      if (path.endsWith('/')) {
        exit('ValidationException', `Parameter cannot end in '/'`)
      }
      if (unknownApp || !services[serviceType] || !services[serviceType][param]) {
        exit(`ParameterNotFound`)
      }
      let Parameter = getParam(param, services[serviceType][param])
      res.end(JSON.stringify({ Parameter }))
      return
    }
  }
  catch (err) {
    update.verbose.warn(err)
    res.statusCode = 400
    error = error || { __type: 'InternalServerError', message: 'Unknown Sandbox error: ' + err.stack }
    res.end(JSON.stringify(error))
    return
  }
}
