let { join } = require('path')
let net = require('net')
let { promisify } = require('util')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'sandbox', 'ports')
let _getPorts = require(sut)
let getPorts = promisify(_getPorts)
let always = { _arc: 2222 }
let update = { verbose: { done: () => {} } }
let inventory, params, tester

async function listen (t, port) {
  return new Promise((res, rej) => {
    tester = net.createServer()
    tester.listen(port)
    tester.once('error', err => {
      t.fail(err)
      rej()
    })
    tester.once('listening', res)
  })
}

async function stopListening (t) {
  return new Promise((res, rej) => {
    try {
      tester.close(res)
    }
    catch (err) {
      t.fail(err)
      rej()
    }
  })
}

function reset () {
  inventory = { inv: { _project: { manifest: 'idk', preferences: { sandbox: null } } } }
  params = undefined
}

test('Set up env', t => {
  t.plan(1)
  t.ok(getPorts, 'Port module is present')
})

test('Ports do (almost) nothing', async t => {
  t.plan(1)
  reset()
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, always, 'Got back internal _arc services port')
})

test('HTTP port selection', async t => {
  t.plan(8)
  let http = 3333

  reset()
  inventory.inv.http = []
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { http, ...always }, 'Got back default HTTP port')

  let port = 1234
  reset()
  inventory.inv.http = []
  inventory.inv._project.preferences.sandbox = { ports: { http: port } }
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { http: port, ...always }, 'Got back HTTP port from prefs.arc')

  reset()
  inventory.inv.http = []
  params = { port, inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { http: port, ...always }, 'Got back default port API option')

  let envVar = 2345
  process.env.ARC_HTTP_PORT = envVar
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { http: envVar, ...always }, 'Got back HTTP from ARC_HTTP_PORT env var')
  delete process.env.ARC_HTTP_PORT

  process.env.PORT = envVar
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { http: envVar, ...always }, 'Got back HTTP from PORT env var')
  delete process.env.PORT

  reset()
  inventory.inv.static = {}
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { http, ...always }, 'Got back default HTTP port for @static')

  reset()
  inventory.inv.ws = []
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { http, ...always }, 'Got back default HTTP port for @ws')

  try {
    await listen(t, 3333)
    reset()
    inventory.inv.http = []
    params = { inventory, update }
    await getPorts(params)
  }
  catch (err) {
    t.match(err.message, /Port 3333 \(http\) is already in use/, 'Got error: ' + err.message)
  }
  await stopListening(t)
})

test('Events port selection', async t => {
  t.plan(6)
  let events = 4444

  reset()
  inventory.inv.events = []
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { events, ...always }, 'Got back default events port')

  let port = 1234
  reset()
  inventory.inv.events = []
  inventory.inv._project.preferences.sandbox = { ports: { events: port } }
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { events: port, ...always }, 'Got back events port from prefs.arc')

  reset()
  inventory.inv.queues = []
  inventory.inv._project.preferences.sandbox = { ports: { queues: port } }
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { events: port, ...always }, 'Got back queues port from prefs.arc')

  reset()
  inventory.inv.queues = []
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { events, ...always }, 'Got back default queues port')

  await listen(t, events)

  // Automatic selection
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { events: 4445, ...always }, 'Automatically found port when default events port was occupied')

  // Blow up when specified
  try {
    reset()
    inventory.inv.events = []
    inventory.inv._project.preferences.sandbox = { ports: { events } }
    params = { inventory, update }
    await getPorts(params)
  }
  catch (err) {
    t.match(err.message, /Port 4444 \(events\) is already in use/, 'Got error: ' + err.message)
  }

  await stopListening(t)
})

test('Tables port selection', async t => {
  t.plan(6)
  let tables = 5555

  reset()
  inventory.inv.tables = []
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { tables, ...always }, 'Got back default tables port')

  reset()
  inventory.inv._project.manifest = null
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { tables, ...always }, 'Got back default tables port when default manifest is used')

  let port = 1234
  reset()
  inventory.inv.tables = []
  inventory.inv._project.preferences.sandbox = { ports: { tables: port } }
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { tables: port, ...always }, 'Got back tables port from prefs.arc')

  let envVar = 2345
  process.env.ARC_DB_EXTERNAL = true
  process.env.ARC_TABLES_PORT = envVar
  await listen(t, envVar)
  reset()
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { tables: envVar, ...always }, 'Got back occupied tables port for external DB')
  await stopListening(t)
  delete process.env.ARC_DB_EXTERNAL
  delete process.env.ARC_TABLES_PORT

  await listen(t, tables)

  // Automatic selection
  reset()
  inventory.inv.tables = []
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { tables: 5556, ...always }, 'Automatically found port when default tables port was occupied')

  // Blow up when specified
  try {
    reset()
    inventory.inv.tables = []
    inventory.inv._project.preferences.sandbox = { ports: { tables } }
    params = { inventory, update }
    await getPorts(params)
  }
  catch (err) {
    t.match(err.message, /Port 5555 \(tables\) is already in use/, 'Got error: ' + err.message)
  }

  await stopListening(t)
})

test('_arc port selection', async t => {
  t.plan(2)
  let _arc = 2222

  reset()
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, always, 'Got back default _arc port')

  await listen(t, _arc)
  params = { inventory, update }
  await getPorts(params)
  t.deepEqual(params.ports, { _arc: 2223 }, 'Automatically found port when default _arc port was occupied')
  await stopListening(t)
})

test('Specified port conflict', async t => {
  t.plan(1)
  let http = 1234, tables = 1234
  try {
    reset()
    inventory.inv.http = []
    inventory.inv.tables = []
    inventory.inv._project.preferences.sandbox = { ports: { http, tables } }
    params = { inventory, update }
    await getPorts(params)
  }
  catch (err) {
    t.match(err.message, /Port conflict found on 1234/, 'Got error: ' + err.message)
  }
})
