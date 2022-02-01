let { join } = require('path')
let sut = join(process.cwd(), 'src', 'lib', 'check-runtimes', 'version-check')
let _inventory = require('@architect/inventory')
let versionCheck = require(sut)
let test = require('tape')
let cwd = process.cwd()

test('Set up env', t => {
  t.plan(1)
  t.ok(versionCheck, 'Version check module is present')
})

test('Project global runtime config', async t => {
  t.plan(14)
  let rawArc, inventory, localRuntimes, result
  let basic = `@app\nversionCheck\n@http\nget /`

  rawArc = basic
  inventory = await _inventory({ rawArc })
  localRuntimes = { node: '16.0.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  t.notOk(result, 'Control: no runtime configuration did not return any issues')

  rawArc = basic + '\n@aws\nruntime node'
  inventory = await _inventory({ rawArc })
  localRuntimes = { node: '16.0.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  t.notOk(result, 'Control: compatible runtime configuration did not return any issues')

  // Alias
  rawArc = basic + '\n@aws\nruntime node'
  inventory = await _inventory({ rawArc })
  localRuntimes = { node: '10.0.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('Project global runtime'), 'Reported issue with project global runtime')
  t.ok(result[1].includes('aliased to node'), 'Reported issue with alias')

  // Minor
  rawArc = basic + '\n@aws\nruntime nodejs12.x'
  inventory = await _inventory({ rawArc })
  localRuntimes = { node: '12.1.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  t.notOk(result, 'Compatible runtime configuration did not return any issues')

  // Major
  rawArc = basic + '\n@aws\nruntime nodejs12.x'
  inventory = await _inventory({ rawArc })
  localRuntimes = { node: '10.0.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('Project global runtime'), 'Reported issue with project global runtime')

  // Alias
  rawArc = basic + '\n@aws\nruntime python'
  inventory = await _inventory({ rawArc })
  localRuntimes = { python: '10.0.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('Project global runtime'), 'Reported issue with project global runtime')
  t.ok(result[1].includes('aliased to python'), 'Reported issue with alias')

  // Minor
  rawArc = basic + '\n@aws\nruntime python3.8'
  inventory = await _inventory({ rawArc })
  localRuntimes = { python: '3.7.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('Project global runtime'), 'Reported issue with project global runtime')

  // Major
  rawArc = basic + '\n@aws\nruntime python3.8'
  inventory = await _inventory({ rawArc })
  localRuntimes = { python: '2.8.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('Project global runtime'), 'Reported issue with project global runtime')

  // Alias
  rawArc = basic + '\n@aws\nruntime ruby'
  inventory = await _inventory({ rawArc })
  localRuntimes = { ruby: '10.0.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('Project global runtime'), 'Reported issue with project global runtime')
  t.ok(result[1].includes('aliased to ruby'), 'Reported issue with alias')

  // Minor
  rawArc = basic + '\n@aws\nruntime ruby2.7'
  inventory = await _inventory({ rawArc })
  localRuntimes = { ruby: '2.6.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('Project global runtime'), 'Reported issue with project global runtime')

  // Major
  rawArc = basic + '\n@aws\nruntime ruby2.7'
  inventory = await _inventory({ rawArc })
  localRuntimes = { ruby: '1.7.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('Project global runtime'), 'Reported issue with project global runtime')
})

test('Per-Lambda runtime config', async t => {
  t.plan(8)
  let rawArc, inventory, localRuntimes, result
  let basic = `@app\nversionCheck\n@http\nget /`

  rawArc = basic
  inventory = await _inventory({ rawArc })
  localRuntimes = { node: '16.0.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  t.notOk(result, 'Control: no runtime configuration did not return any issues')

  inventory = await _inventory({ rawArc })
  inventory.inv.http[0].config.runtime = 'nodejs14.x'
  localRuntimes = { node: '16.0.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  t.notOk(result, 'Control: compatible runtime configuration did not return any issues')

  // Minor
  inventory = await _inventory({ rawArc })
  inventory.inv.http[0].config.runtime = 'nodejs12.x'
  localRuntimes = { node: '12.1.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  t.notOk(result, 'Compatible runtime configuration did not return any issues')

  // Major
  inventory = await _inventory({ rawArc })
  inventory.inv.http[0].config.runtime = 'nodejs14.x'
  localRuntimes = { node: '12.0.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('nodejs14.x'), 'Reported issue with Lambda runtime')

  // Minor
  inventory = await _inventory({ rawArc })
  inventory.inv.http[0].config.runtime = 'python3.8'
  localRuntimes = { python: '3.7.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('python3.8'), 'Reported issue with Lambda runtime')

  // Major
  inventory = await _inventory({ rawArc })
  inventory.inv.http[0].config.runtime = 'python3.8'
  localRuntimes = { python: '2.8.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('python3.8'), 'Reported issue with Lambda runtime')

  // Minor
  inventory = await _inventory({ rawArc })
  inventory.inv.http[0].config.runtime = 'ruby2.7'
  localRuntimes = { ruby: '2.6.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('ruby2.7'), 'Reported issue with Lambda runtime')

  // Major
  inventory = await _inventory({ rawArc })
  inventory.inv.http[0].config.runtime = 'ruby2.7'
  localRuntimes = { ruby: '1.7.0' }
  result = versionCheck({ cwd, inventory, localRuntimes })
  console.log(result[1])
  t.ok(result[1].includes('ruby2.7'), 'Reported issue with Lambda runtime')
})
