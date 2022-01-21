// TODO fix plugin service discovery
/* let test = require('tape')
let services = require('../../../../../src/arc/_ssm/_services')

test('should not mutate inventory if serviceDiscovery property already exists', t => {
  t.plan(1)
  let inventory = { inv: { _serviceDiscovery: {} } }
  let invFingerprint = JSON.stringify(inventory)
  services(inventory)
  t.equals(JSON.stringify(inventory), invFingerprint, 'inventory not modified')
})
test('should populate serviceDiscovery property with plugin variables', t => {
  t.plan(3)
  let inventory = { inv: { app: 'testapp', _project: { plugins: {
    pluginOne: { variables: () => ({ oneVar: 'yep' }) },
    pluginTwo: { variables: () => ({ twoVar: 'yup' }) }
  } } } }
  services(inventory)
  let svcs = inventory.inv._serviceDiscovery
  t.ok(svcs, '_serviceDiscovery property created')
  t.equals(svcs.pluginOne.oneVar, 'yep', 'first plugin variable created')
  t.equals(svcs.pluginTwo.twoVar, 'yup', 'second plugin variable created')
}) */
