let services = require('./_services')

module.exports = function _ssm (params, req, res) {
  let { body, inventory } = params

  // Populate services: a rare inv mutation, necessary because this is an artifact of the current inventory
  services(inventory)
  let { app, _serviceDiscovery } = inventory.inv

  let message
  try {
    message = JSON.parse(body)
    let Parameters = []
    let type = message.Path.split('/').filter(Boolean)[1]
    if (_serviceDiscovery[type]) {
      Object.entries(_serviceDiscovery[type]).forEach(([ key, Value ]) => {
        Parameters.push({
          Name: `/${app}/${type}/${key}`,
          Type: 'String',
          Value,
          Version: 1,
          LastModifiedDate: new Date(Date.now()).toISOString(),
          ARN: 'Architect Sandbox'
        })
      })
    }
    res.statusCode = 200
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ Parameters }))
    return
  }
  catch (e) {
    res.statusCode = 400
    res.end('Sandbox service discovery exception parsing request body')
    return
  }
}
