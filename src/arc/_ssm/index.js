let services = require('./_services')

module.exports = function _ssm (params, req, res) {
  let { body, inventory } = params

  // Populate services: a rare inv mutation, necessary because this is an artifact of the current inventory
  services(inventory)
  let { _serviceDiscovery } = inventory.inv

  let message, stack
  let Parameters = []
  try {
    message = JSON.parse(body)
    stack = message.Path.split('/').filter(Boolean)[0] // cloudformation stack name
  }
  catch (e) {
    res.statusCode = 400
    res.end('Sandbox service discovery exception parsing request body')
    return
  }
  Object.entries(_serviceDiscovery).forEach(([ type, map ]) => {
    Object.entries(map).forEach(([ key, Value ]) => {
      Parameters.push({
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
