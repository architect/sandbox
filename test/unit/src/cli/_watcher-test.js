let { join } = require('path')
let { existsSync, rmSync, writeFileSync } = require('fs')
let { tmpdir } = require('os')
let test = require('tape')
let events = require('events')
let _inventory = require('@architect/inventory')
let proxyquire = require('proxyquire')
let sut = join(process.cwd(), 'src', 'cli', '_watcher')

let sent
let livereload = { clients: [ { readyState: 1, send: e => sent = e } ] }
let _arc = { livereload: undefined }
let chokidar = { watch: () => new events() }
let watcher
let setupWatcher = () => watcher = proxyquire(sut, { chokidar, '../arc': _arc })
setupWatcher()
let cwd = join(process.cwd(), 'test', 'mock', 'watcher')

let rehydrateCalled = 0
let rehydrateParams
function rehydrate (params, cb) {
  rehydrateCalled++
  rehydrateParams = params
  if (cb) cb()
}
function reset () {
  setupWatcher()
  rehydrateCalled = 0
  rehydrateParams = undefined
  log = ''
  debug = ''
  verbose = ''
  sent = undefined
  _arc = { livereload: undefined }
}

let inventory
let log = ''
let debug = ''
let verbose = ''
let l = str => log += str
let d = str => debug += str
let v = str => verbose += str
let noop = () => {}
let basicParams = {
  enable: true,
  debounce: 10, // Set lower than in production because Tape won't wait around forever
  rehydrate,
  ts: noop,
}
let update = {
  debug: { status: d },
  done: l,
  error: l,
  status: l,
  verbose: { status: v },
  warn: l,
}

/**
 * Ok, this is an interesting test case! Some notes:
 * - Testing the watcher as a proper integration test inside a live Sandbox CLI run is perhaps feasible, but very difficult due to the highly asynchronous nature of both Sandbox and the watcher
 * - The goal here is to test our watcher implementation, not the file watcher lib itself (Chokidar), or other things the watcher calls (e.g. `sandbox.start/end`)
 * - Watcher events may follow a sync execution path (e.g. (un)pausing, rehydration), or async execution path (e.g. reinventorying, restarting Sandbox services)
 *   - As such, rewriting with proxyquire many times to deeply inject stubs is necessary
 *   - I have vague concerns about nondeterminism / race conditions upon event invocations, but sync execution seems to stay ahead of test assertions in the call stack
 * - Debounce is set low to ensure the test doesn't falsely time out
 */
test('Set up env', async t => {
  t.plan(2)
  t.ok(watcher, 'Got Sandbox watcher module')
  inventory = await _inventory({ cwd })
  t.ok(inventory, 'Got inventory of watcher project')
})

test('Disabled watcher does nothing', t => {
  t.plan(2)
  let watch
  watch = watcher({})
  t.notOk(watch, 'Got nothing (empty params)')
  watch = watcher({ enable: false })
  t.notOk(watch, 'Got nothing (enable set to false)')
})

test('Watcher ignores certain events', t => {
  t.plan(2)
  let watch = watcher(basicParams, { inventory, update })
  watch.emit('all', 'addDir', 'foo')
  t.equal(debug, `Watcher: ignored 'addDir' on foo`, 'Watcher ignored event')
  t.notOk(log, 'Watcher did nothing else')
  reset()
})

test('Start, pause, and unpause the watcher', t => {
  t.plan(17)
  let watch
  let pauseFile = join(tmpdir(), '_pause-architect-sandbox-watcher')

  writeFileSync(pauseFile, 'hi')
  t.ok(existsSync(pauseFile), 'Wrote pause file to disk')
  watch = watcher(basicParams, { inventory, update })
  t.notOk(existsSync(pauseFile), 'Watcher cleaned up old pause file on startup')

  writeFileSync(pauseFile, 'hi')
  watch.emit('all', '', '')
  t.equal(log, 'Watcher temporarily paused', 'Watcher paused')
  reset()

  watch.emit('all', '', '')
  t.equal(rehydrateCalled, 0, 'Rehydrate not called')
  t.notOk(log, 'Watcher did nothing while paused')
  reset()

  rmSync(pauseFile)
  watch.emit('all', '', '')
  t.equal(rehydrateCalled, 0, 'Rehydrate not called')
  t.equal(log, 'Watcher no longer paused', 'Watcher taken off pause')
  reset()

  // Rehydrate after being paused, restoring symlinks
  _arc.livereload = livereload
  reset() // Reset again because we just mutated _arc
  watch = watcher(basicParams, { inventory, symlink: true, update })
  writeFileSync(pauseFile, 'hi')

  watch.emit('all', '', '')
  t.equal(log, 'Watcher temporarily paused', 'Watcher paused')
  t.notOk(sent, 'Livereload did not fire')
  reset()

  watch.emit('all', '', '')
  t.equal(rehydrateCalled, 0, 'Rehydrate not called')
  t.notOk(log, 'Watcher did nothing while paused')
  t.notOk(sent, 'Livereload did not fire')
  reset()

  rmSync(pauseFile)
  watch.emit('all', '', '')
  t.equal(rehydrateCalled, 1, 'Rehydrate called')
  t.equal(rehydrateParams.timer, 'rehydrateAll', 'Set rehydrateAll timer')
  t.ok(rehydrateParams.force, 'Set force: true')
  t.equal(log, 'Watcher no longer paused', 'Watcher taken off pause')
  t.equal(sent, 'reload', 'Livereload fired')
  reset()
})

// Ideally we'd do live reloader testing in the next few test blocks, but seeing as how Sandbox start/end simulation doesn't follow naturally concern itself with what's in its callbacks, that's not super practical
test('Watcher restarts services on manifest updates', t => {
  t.plan(5)
  watcher = proxyquire(sut, {
    chokidar,
    '../': {
      start: (params, cb) => {
        t.pass('Restarted Sandbox')
        t.ok(params.restart, 'Passed restart option sandbox.start')
        t.ok(params.inventory._restarted, 'Passed updated Inventory to sandbox.start')
        cb()
      },
      end: (cb) => {
        t.pass('Ended Sandbox')
        cb()
      },
    },
    '@architect/inventory': (params, callback) => {
      t.equal(params.cwd, cwd, 'Called Inventory')
      inventory._restarted = true
      callback(null, inventory)
    },
  })
  let watch = watcher(basicParams, { inventory, update })
  watch.emit('all', 'update', join(cwd, 'app.arc'))
  t.teardown(() => {
    delete inventory._restarted
    reset()
  })
})

test('Watcher reinventories on preference file changes', t => {
  function reinventory (t) {
    return (params, callback) => {
      t.equal(params.cwd, cwd, 'Called Inventory')
      inventory._restarted = true
      callback(null, inventory)
      t.match(log, /Loaded latest project preferences/, 'Reinventoried')
      log = ''
    }
  }
  function restartSandbox (t) {
    return {
      start: (params, cb) => {
        t.pass('Restarted Sandbox')
        t.ok(params.restart, 'Passed restart option sandbox.start')
        t.ok(params.inventory._restarted, 'Passed updated Inventory to sandbox.start')
        cb()
      },
      end: (cb) => {
        t.pass('Ended Sandbox')
        cb()
      },
    }
  }

  t.test('.env', t => {
    t.plan(6)
    watcher = proxyquire(sut, {
      chokidar,
      '@architect/inventory': reinventory(t),
      '../': restartSandbox(t),
    })
    let watch = watcher(basicParams, { inventory, update })
    watch.emit('all', 'update', join(cwd, '.env'))
  })

  t.test('prefs.arc', t => {
    t.plan(6)
    watcher = proxyquire(sut, {
      chokidar,
      '@architect/inventory': reinventory(t),
      '../': restartSandbox(t),
    })
    let watch = watcher(basicParams, { inventory, update })
    let filepath = join(cwd, 'prefs.arc')
    inventory.inv._project.localPreferencesFile = filepath
    watch.emit('all', 'update', filepath)
    inventory.inv._project.localPreferencesFile = null
  })

  t.test('preferences.arc', t => {
    t.plan(6)
    watcher = proxyquire(sut, {
      chokidar,
      '@architect/inventory': reinventory(t),
      '../': restartSandbox(t),
    })
    let watch = watcher(basicParams, { inventory, update })
    let filepath = join(cwd, 'preferences.arc')
    inventory.inv._project.localPreferencesFile = filepath
    watch.emit('all', 'update', filepath)
    inventory.inv._project.localPreferencesFile = null
  })

  t.test('Global preferences', t => {
    t.plan(6)
    watcher = proxyquire(sut, {
      chokidar,
      '@architect/inventory': reinventory(t),
      '../': restartSandbox(t),
    })
    let watch = watcher(basicParams, { inventory, update })
    let globalPrefs = join(cwd, 'lolidk')
    inventory.inv._project.globalPreferencesFile = globalPrefs
    watch.emit('all', 'update', globalPrefs)
    inventory.inv._project.globalPreferencesFile = null
  })

  t.teardown(reset)
})

test('Rehydrate shared / views', t => {
  t.plan(8)
  _arc.livereload = livereload
  reset() // Reset again because we just mutated _arc
  let watch = watcher(basicParams, { inventory, update })

  let sharedFile = join(cwd, 'src', 'shared', 'index.js')
  watch.emit('all', 'update', sharedFile)
  t.equal(rehydrateCalled, 1, 'Rehydrate called')
  t.equal(rehydrateParams.timer, 'rehydrateShared', 'Set rehydrateShared timer')
  t.equal(rehydrateParams.only, 'shared', 'Scoped to share')
  t.equal(sent, 'reload', 'Livereload fired')
  reset()

  let viewsFile = join(cwd, 'src', 'views', 'index.js')
  watch.emit('all', 'update', viewsFile)
  t.equal(rehydrateCalled, 1, 'Rehydrate called')
  t.equal(rehydrateParams.timer, 'rehydrateViews', 'Set rehydrateViews timer')
  t.equal(rehydrateParams.only, 'views', 'Scoped to views')
  t.equal(sent, 'reload', 'Livereload fired')
  reset()
})

test('Livereload fires for certain HTTP Lambdas', t => {
  t.plan(3)
  _arc.livereload = livereload
  reset() // Reset again because we just mutated _arc
  let watch = watcher(basicParams, { inventory, update })

  let postHandler = join(cwd, 'src', 'http', 'post-index', 'index.js')
  watch.emit('all', 'update', postHandler)
  t.equal(sent, undefined, 'Livereload did not fire')

  let eventsHandler = join(cwd, 'src', 'events', 'an-event', 'index.js')
  watch.emit('all', 'update', eventsHandler)
  t.equal(sent, undefined, 'Livereload did not fire')

  let getHandler = join(cwd, 'src', 'http', 'get-index', 'index.js')
  watch.emit('all', 'update', getHandler)
  t.equal(sent, 'reload', 'Livereload fired')
  reset()
})

test('Regenerate static.json', t => {
  t.plan(5)
  _arc.livereload = livereload
  watcher = proxyquire(sut, {
    chokidar,
    '@architect/utils': { fingerprint: (params, callback) => {
      t.ok(params.inventory, 'Fingerprint called')
      callback(null, 'ok')
      t.equal(rehydrateCalled, 1, 'Rehydrate was called')
      t.equal(rehydrateParams.timer, 'rehydrateStatic', 'Set rehydrateStatic timer')
      t.equal(rehydrateParams.only, 'staticJson', 'Scoped to staticJson')
      t.equal(sent, 'reload', 'Livereload fired')
    } },
    '../arc': _arc,
  })
  let watch = watcher(basicParams, { inventory, update })

  let asset = join(cwd, 'public', 'index.html')
  watch.emit('all', 'update', asset)
  reset()
})

test('Watcher plugins', t => {
  t.plan(2)
  let expected = {
    filename: 'some-file',
    event: 'update',
    inventory,
    arc: inventory.inv._project.arc,
    // invoke goes here, see below
  }
  // Deep equality comparison doesn't run against the bound invoker ref, so extract it from the plugin params and inject it into the comparison
  let compare = ({ invoke }) => {
    if (!invoke) t.fail('Expected invoke method')
    return { ...expected, invoke }
  }
  let one = async params => t.deepEqual(params, compare(params), 'Plugin one called with correct params')
  let two = async params => t.deepEqual(params, compare(params), 'Plugin two called with correct params')
  inventory.inv.plugins = { _methods: { sandbox: { watcher: [ one, two ] } } }
  let watch = watcher(basicParams, { inventory, update })
  watch.emit('all', 'update', 'some-file')
})
