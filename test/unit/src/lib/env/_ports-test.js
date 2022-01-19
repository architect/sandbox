let { join } = require('path')
let net = require('net')
let { promisify } = require('util')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'lib', 'env', '_ports')
let _getPorts = require(sut)
let getPorts = promisify(_getPorts)
let always = { _arc: 2222 }
let tester

let freshInv = () => ({ inv: { _project: { manifest: 'idk', preferences: { sandbox: null } } } })
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

test('Set up env', t => {
  t.plan(1)
  t.ok(getPorts, 'Port module is present')
})

test('Ports do (almost) nothing', async t => {
  t.plan(1)
  let result = await getPorts({ inventory: freshInv() })
  t.deepEqual(result, always, 'Got back internal _arc services port')
})

test('HTTP port selection', async t => {
  t.plan(8)
  let inventory, result
  let http = 3333

  inventory = freshInv()
  inventory.inv.http = []
  result = await getPorts({ inventory })
  t.deepEqual(result, { http, ...always }, 'Got back default HTTP port')

  let port = 1234
  inventory = freshInv()
  inventory.inv.http = []
  inventory.inv._project.preferences.sandbox = { ports: { http: port } }
  result = await getPorts({ inventory })
  t.deepEqual(result, { http: port, ...always }, 'Got back HTTP port from prefs.arc')

  inventory = freshInv()
  inventory.inv.http = []
  result = await getPorts({ port, inventory })
  t.deepEqual(result, { http: port, ...always }, 'Got back default port API option')

  let envVar = 2345
  process.env.ARC_HTTP_PORT = envVar
  result = await getPorts({ inventory })
  t.deepEqual(result, { http: envVar, ...always }, 'Got back HTTP from ARC_HTTP_PORT env var')
  delete process.env.ARC_HTTP_PORT

  process.env.PORT = envVar
  result = await getPorts({ inventory })
  t.deepEqual(result, { http: envVar, ...always }, 'Got back HTTP from PORT env var')
  delete process.env.PORT

  inventory = freshInv()
  inventory.inv.static = {}
  result = await getPorts({ inventory })
  t.deepEqual(result, { http, ...always }, 'Got back default HTTP port for @static')

  inventory = freshInv()
  inventory.inv.ws = []
  result = await getPorts({ inventory })
  t.deepEqual(result, { http, ...always }, 'Got back default HTTP port for @ws')

  try {
    await listen(t, 3333)
    inventory = freshInv()
    inventory.inv.http = []
    await getPorts({ inventory })
  }
  catch (err) {
    t.match(err.message, /Port 3333 \(http\) is already in use/, 'Got error: ' + err.message)
  }
  await stopListening(t)
})

test('Events port selection', async t => {
  t.plan(6)
  let inventory, result
  let events = 4444

  inventory = freshInv()
  inventory.inv.events = []
  result = await getPorts({ inventory })
  t.deepEqual(result, { events, ...always }, 'Got back default events port')

  let port = 1234
  inventory = freshInv()
  inventory.inv.events = []
  inventory.inv._project.preferences.sandbox = { ports: { events: port } }
  result = await getPorts({ inventory })
  t.deepEqual(result, { events: port, ...always }, 'Got back events port from prefs.arc')

  inventory = freshInv()
  inventory.inv.queues = []
  inventory.inv._project.preferences.sandbox = { ports: { queues: port } }
  result = await getPorts({ inventory })
  t.deepEqual(result, { events: port, ...always }, 'Got back queues port from prefs.arc')

  inventory = freshInv()
  inventory.inv.queues = []
  result = await getPorts({ inventory })
  t.deepEqual(result, { events, ...always }, 'Got back default queues port')

  await listen(t, events)

  // Automatic selection
  result = await getPorts({ inventory })
  t.deepEqual(result, { events: 4445, ...always }, 'Automatically found port when default events port was occupied')

  // Blow up when specified
  try {
    inventory = freshInv()
    inventory.inv.events = []
    inventory.inv._project.preferences.sandbox = { ports: { events } }
    await getPorts({ inventory })
  }
  catch (err) {
    t.match(err.message, /Port 4444 \(events\) is already in use/, 'Got error: ' + err.message)
  }

  await stopListening(t)
})

test('Tables port selection', async t => {
  t.plan(6)
  let inventory, result
  let tables = 5555

  inventory = freshInv()
  inventory.inv.tables = []
  result = await getPorts({ inventory })
  t.deepEqual(result, { tables, ...always }, 'Got back default tables port')

  inventory = freshInv()
  inventory.inv._project.manifest = null
  result = await getPorts({ inventory })
  t.deepEqual(result, { tables, ...always }, 'Got back default tables port when default manifest is used')

  let port = 1234
  inventory = freshInv()
  inventory.inv.tables = []
  inventory.inv._project.preferences.sandbox = { ports: { tables: port } }
  result = await getPorts({ inventory })
  t.deepEqual(result, { tables: port, ...always }, 'Got back tables port from prefs.arc')

  let envVar = 2345
  process.env.ARC_DB_EXTERNAL = true
  process.env.ARC_TABLES_PORT = envVar
  await listen(t, envVar)
  inventory = freshInv()
  result = await getPorts({ inventory })
  t.deepEqual(result, { tables: envVar, ...always }, 'Got back occupied tables port for external DB')
  await stopListening(t)
  delete process.env.ARC_DB_EXTERNAL
  delete process.env.ARC_TABLES_PORT

  await listen(t, tables)

  // Automatic selection
  inventory = freshInv()
  inventory.inv.tables = []
  result = await getPorts({ inventory })
  t.deepEqual(result, { tables: 5556, ...always }, 'Automatically found port when default tables port was occupied')

  // Blow up when specified
  try {
    inventory = freshInv()
    inventory.inv.tables = []
    inventory.inv._project.preferences.sandbox = { ports: { tables } }
    await getPorts({ inventory })
  }
  catch (err) {
    t.match(err.message, /Port 5555 \(tables\) is already in use/, 'Got error: ' + err.message)
  }

  await stopListening(t)
})

test('_arc port selection', async t => {
  t.plan(2)
  let inventory, result
  let _arc = 2222

  inventory = freshInv()
  result = await getPorts({ inventory })
  t.deepEqual(result, always, 'Got back default _arc port')

  await listen(t, _arc)
  result = await getPorts({ inventory })
  t.deepEqual(result, { _arc: 2223 }, 'Automatically found port when default _arc port was occupied')
  await stopListening(t)
})

test('Specified port conflict', async t => {
  t.plan(1)
  let inventory, http, tables
  http = tables = 1234
  try {
    inventory = freshInv()
    inventory.inv.http = []
    inventory.inv.tables = []
    inventory.inv._project.preferences.sandbox = { ports: { http, tables } }
    await getPorts({ inventory })
  }
  catch (err) {
    t.match(err.message, /Port conflict found on 1234/, 'Got error: ' + err.message)
  }
})
