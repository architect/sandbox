let services = require('./_services')

module.exports = function _ssm (params, req, res) {
  let { body, inventory } = params

  if (req.method !== 'POST') {
    res.statusCode = 404
    res.end()
    return
  }

  // Populate services: a rare inv mutation, necessary because this is an artifact of the current inventory
  services(inventory)
  let { _serviceDiscovery } = inventory.inv

  let message, stack, serviceType
  let Parameters = []
  try {
    message = JSON.parse(body)
    let parts = message.Path.split('/').filter(Boolean)
    stack = parts[0] // cloudformation stack name
    serviceType = parts[1] // service type being requested
  }
  catch (e) {
    res.statusCode = 400
    res.end('Sandbox service discovery exception parsing request body')
    return
  }
  Object.entries(_serviceDiscovery).forEach(([ type, map ]) => {
    Object.entries(map).forEach(([ key, Value ]) => {
      if (!serviceType || type === serviceType) Parameters.push({
        Name: `/${stack}/${type}/${key}`,
        Type: 'String',
        Value,
        Version: 1,
        LastModifiedDate: new Date(Date.now()).toISOString(),
        ARN: 'Architect Sandbox'
      })
    })
  })
  res.statusCode = 200
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ Parameters }))
  return
}
