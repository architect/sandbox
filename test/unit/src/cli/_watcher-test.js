let { join } = require('path')
let { existsSync, rmSync, writeFileSync } = require('fs')
let { tmpdir } = require('os')
let test = require('tape')
let events = require('events')
let _inventory = require('@architect/inventory')
let proxyquire = require('proxyquire')
let sut = join(process.cwd(), 'src', 'cli', '_watcher')

let chokidar = { watch: () => new events() }
let watcher
let setupWatcher = () => watcher = proxyquire(sut, { chokidar })
setupWatcher()
let cwd = join(process.cwd(), 'test', 'mock', 'watcher')

let rehydrateCalled = 0
let rehydrateParams
function rehydrate (params) {
  rehydrateCalled++
  rehydrateParams = params
}
function reset () {
  setupWatcher()
  rehydrateCalled = 0
  rehydrateParams = undefined
  log = ''
  debug = ''
}

let inventory
let log = ''
let debug = ''
let l = str => log += str
let d = str => debug += str
let noop = () => {}
let basicParams = {
  enable: true,
  debounce: 10, // Set lower than in production because Tape won't wait around forever
  rehydrate,
  ts: noop,
  update: { done: l, warn: l, debug: { status: d }, status: l, error: l }
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
  let watch = watcher({ ...basicParams, inventory })
  watch.emit('all', 'addDir', 'foo')
  t.equal(debug, `Watcher: ignored 'addDir' on foo`, 'Watcher ignored event')
  t.notOk(log, 'Watcher did nothing else')
  reset()
})

test('Start, pause, and unpause the watcher', t => {
  t.plan(14)
  let watch
  let pauseFile = join(tmpdir(), '_pause-architect-sandbox-watcher')

  writeFileSync(pauseFile, 'hi')
  t.ok(existsSync(pauseFile), 'Wrote pause file to disk')
  watch = watcher({ ...basicParams, inventory })
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
  watch = watcher({ ...basicParams, inventory, symlink: true })
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
  t.equal(rehydrateCalled, 1, 'Rehydrate called')
  t.equal(rehydrateParams.timer, 'rehydrateAll', 'Set rehydrateAll timer')
  t.ok(rehydrateParams.force, 'Set force: true')
  t.equal(log, 'Watcher no longer paused', 'Watcher taken off pause')
  reset()
})

test('Watcher restarts services on manifest updates', t => {
  t.plan(5)
  watcher = proxyquire(sut, {
    chokidar,
    '../sandbox': {
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
  let watch = watcher({ ...basicParams, inventory })
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
      callback(null, inventory)
      t.equal(log, 'Loaded latest project preferences', 'Reinventoried')
      log = ''
    }
  }

  t.test('.env', t => {
    t.plan(2)
    watcher = proxyquire(sut, {
      chokidar,
      '@architect/inventory': reinventory(t)
    })
    let watch = watcher({ ...basicParams, inventory })
    watch.emit('all', 'update', join(cwd, '.env'))
  })

  t.test('prefs.arc', t => {
    t.plan(2)
    watcher = proxyquire(sut, {
      chokidar,
      '@architect/inventory': reinventory(t)
    })
    let watch = watcher({ ...basicParams, inventory })
    watch.emit('all', 'update', join(cwd, 'prefs.arc'))
  })

  t.test('preferences.arc', t => {
    t.plan(2)
    watcher = proxyquire(sut, {
      chokidar,
      '@architect/inventory': reinventory(t)
    })
    let watch = watcher({ ...basicParams, inventory })
    watch.emit('all', 'update', join(cwd, 'preferences.arc'))
  })

  t.test('Global preferences', t => {
    t.plan(2)
    watcher = proxyquire(sut, {
      chokidar,
      '@architect/inventory': reinventory(t)
    })
    let watch = watcher({ ...basicParams, inventory })
    let globalPrefs = join(cwd, 'lolidk')
    inventory.inv._project.globalPreferencesFile = globalPrefs
    watch.emit('all', 'update', globalPrefs)
  })

  t.teardown(() => {
    inventory.inv._project.globalPreferencesFile = null
    reset()
  })
})

test('Rehydrate views / views', t => {
  t.plan(6)
  let watch = watcher({ ...basicParams, inventory })

  let sharedFile = join(cwd, 'src', 'shared', 'index.js')
  watch.emit('all', 'update', sharedFile)
  t.equal(rehydrateCalled, 1, 'Rehydrate called')
  t.equal(rehydrateParams.timer, 'rehydrateShared', 'Set rehydrateShared timer')
  t.equal(rehydrateParams.only, 'shared', 'Scoped to share')
  reset()

  let viewsFile = join(cwd, 'src', 'views', 'index.js')
  watch.emit('all', 'update', viewsFile)
  t.equal(rehydrateCalled, 1, 'Rehydrate called')
  t.equal(rehydrateParams.timer, 'rehydrateViews', 'Set rehydrateViews timer')
  t.equal(rehydrateParams.only, 'views', 'Scoped to views')
  reset()
})

test('Regenerate static.json', t => {
  t.plan(4)
  watcher = proxyquire(sut, {
    chokidar,
    '@architect/utils': { fingerprint: (params, callback) => {
      t.ok(params.inventory, 'Fingerprint called')
      callback(null, 'ok')
      t.equal(rehydrateCalled, 1, 'Rehydrate was called')
      t.equal(rehydrateParams.timer, 'rehydrateStatic', 'Set rehydrateStatic timer')
      t.equal(rehydrateParams.only, 'staticJson', 'Scoped to staticJson')
    } }
  })
  let watch = watcher({ ...basicParams, inventory })

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
  }
  let one = async params => t.deepEqual(params, expected, 'Plugin one called with correct params')
  let two = async params => t.deepEqual(params, expected, 'Plugin two called with correct params')
  inventory.inv.plugins = { _methods: { sandbox: { watcher: [ one, two ] } } }
  let watch = watcher({ ...basicParams, inventory })
  watch.emit('all', 'update', 'some-file')
})
