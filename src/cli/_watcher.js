let { existsSync, unlinkSync } = require('fs')
let { join, sep } = require('path')
let { tmpdir } = require('os')
let _inventory = require('@architect/inventory')
let { deepFrozenCopy, fingerprint } = require('@architect/utils')
let chokidar = require('chokidar')
let _invoke = require('../invoke-lambda/_plugin')
let sandbox = require('../')

module.exports = function runWatcher (args, params) {
  if (!args.enable) return

  let { debounce, rehydrate, ts } = args
  let { inventory, logLevel, symlink, update } = params
  let { cwd } = inventory.inv._project
  let verbose = logLevel === 'verbose'

  // Live reload starts within Sandbox, so we can only load it within the watcher
  let livereload
  // eslint-disable-next-line
  livereload = require('../arc').livereload

  try {
    var watcher = chokidar.watch(cwd, {
      ignored: /(node_modules)|(\.git)|([\\\/]vendor[\\\/])|(__pycache__)|(static\.json)/,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: debounce,
        pollInterval: 25,
      },
    })
  }
  catch (err) {
    update.warn(`Sandbox file watcher failed: ${err.message}`)
    return
  }

  function restart ({ cwd, inventory, update }) {
  // Always attempt to close the http server, but only reload if necessary
    let start = Date.now()
    sandbox.end(err => {
      if (err) update.error(err)
      sandbox.start({ cwd, inventory, restart: true, update }, err => {
        if (err) update.error(err)
        else {
          let end = Date.now()
          update.done(`Sandbox reloaded in ${end - start}ms`)
          // Rewrite the livereload WS server, or connected clients will be orphaned
          // eslint-disable-next-line
          livereload = require('../arc').livereload
        }
      })
    })
  }

  let inv, manifest, staticFolder, shared, views, watcherPlugins
  function refreshInventory () {
    inv = inventory.inv
    manifest = inv._project.manifest
    staticFolder = inv?.static?.folder
    shared = inv?.shared?.src
    views = inv?.views?.src
    watcherPlugins = inv.plugins?._methods?.sandbox?.watcher
  }
  refreshInventory()

  function liveReloadClients () {
    if (livereload) {
      let count = 0
      livereload.clients.forEach(client => {
        if (client.readyState) {
          client.send('reload')
          count++
        }
      })
      if (verbose) {
        let plural = count === 0 || count > 1 ? 's' : ''
        update.verbose.status(`Refreshed ${count} livereload client${plural}`)
      }
    }
  }

  // Cleanup after any past runs
  let pauseFile = join(tmpdir(), '_pause-architect-sandbox-watcher')
  if (existsSync(pauseFile)) {
    unlinkSync(pauseFile)
  }

  let ignoredEvents = [ 'addDir', 'unlinkDir', 'ready', 'raw' ]
  let pluginEvents = [ 'add', 'update', 'remove' ]
  let livereloadMethods = [ 'get', 'any' ]
  let timers = {
    arcEvent: null,
    fingerprint: null,
  }
  // Watcher may be paused by another workflow (like Deploy) placing a file on the filesystem
  let paused = false
  // Userland plugins may mutate the filesystem, so pause the watcher until they complete
  let pluginsRunning = false

  /**
   * Watch for pertinent filesystem changes
   */
  watcher.on('all', function (event, filename) {
    if (ignoredEvents.includes(event)){
      update.debug.status(`Watcher: ignored '${event}' on ${filename}`)
      return
    }
    if (pluginsRunning || paused && existsSync(pauseFile)) {
      return
    }
    if (!paused && existsSync(pauseFile)) {
      paused = true
      update.status('Watcher temporarily paused')
      return
    }
    if (paused && !existsSync(pauseFile)) {
      update.status('Watcher no longer paused')
      paused = false
      // A deploy probably happened (meaning a full hydrate)
      // So now would be a good time to restore symlinks
      if (symlink) {
        rehydrate({
          timer: 'rehydrateAll',
          msg: 'Restoring shared file symlinks...',
          force: true
        }, liveReloadClients)
      }
    }

    // Renormalize events to more be friendlier (or at least RESTier)
    /**/ if (event === 'change') event = 'update'
    else if (event === 'unlink') event = 'remove'
    update.verbose.status(`Watcher: '${event}' on ${filename}`)

    // Event criteria
    let fileUpdate = event === 'update'
    let updateOrRemove = event === 'update' || event === 'remove'
    let anyChange = event === 'add' || event === 'update' || event === 'remove'
    let ran = false // Skips over irrelevant ops after something ran
    let restarting = false // Don't run watcher plugins if we're restarting Sandbox

    // Bail early if it's not a change the watcher cares about
    if (!anyChange) return

    /**
     * Reload routes upon changes to Architect project manifest
     */
    if (fileUpdate && (filename === manifest)) {
      ran = restarting = true
      clearTimeout(timers.arcEvent)
      timers.arcEvent = setTimeout(() => {
        ts()
        // Refresh the Inventory
        _inventory({ cwd }, (err, result) => {
          // If the new Inventory is valid, stop here and let them fix it
          if (err) update.error(err)
          else {
            params.inventory = inventory = result
            refreshInventory()
            update.status('Loaded latest Architect project manifest')
            restart({ cwd, inventory, update })
          }
        })
      }, debounce)
    }

    /**
     * Refresh inventory if preferences or env vars may have changed
     * Note: enumerate both prefs.arc filename in case it is being added for the first time
     */
    if (!ran &&
        (filename === join(cwd, '.env') ||
         filename === inv._project.localPreferencesFile ||
         filename === inv._project.globalPreferencesFile)) {
      ran = restarting = true
      clearTimeout(timers.arcEvent)
      timers.arcEvent = setTimeout(() => {
        ts()
        // Refresh the Inventory
        _inventory({ cwd }, (err, result) => {
          if (err) update.error(err)
          else {
            params.inventory = inventory = result
            refreshInventory()
            update.status('Loaded latest project preferences')
            restart({ cwd, inventory, update })
          }
        })
      }, debounce)
    }

    /**
     * Rehydrate functions with shared files upon changes to src/shared
     */
    if (!ran && updateOrRemove && shared && filename.includes(shared)) {
      ran = true
      rehydrate({
        timer: 'rehydrateShared',
        only: 'shared',
        msg: 'Shared file changed, rehydrating functions...'
      }, liveReloadClients)
    }

    /**
     * Rehydrate functions with shared files upon changes to src/views
     */
    if (!ran && updateOrRemove && views && filename.includes(views)) {
      ran = true
      rehydrate({
        timer: 'rehydrateViews',
        only: 'views',
        msg: 'Views file changed, rehydrating views...'
      }, liveReloadClients)
    }

    /**
     * Regenerate public/static.json upon changes to public/
     */
    let isStaticAsset = inv.static && filename.includes(join(cwd, staticFolder))
    if (!ran && isStaticAsset) {
      ran = true
      clearTimeout(timers.fingerprint)
      timers.fingerprint = setTimeout(() => {
        let start = Date.now()
        fingerprint({ inventory }, function next (err, result) {
          if (err) update.error(err)
          else {
            if (result) {
              let end = Date.now()
              update.status(`Regenerated ${staticFolder}${sep}static.json in ${end - start}ms`)
              rehydrate({
                timer: 'rehydrateStatic',
                only: 'staticJson',
              }, liveReloadClients)
            }
          }
        })
      }, debounce)
    }

    /**
     * Live reload any + get functions;
     */
    if (!ran && livereload) {
      let lambda = Object.values(inv.lambdasBySrcDir).find(({ src }) => filename.includes(src))
      if (lambda?.pragma === 'http' && livereloadMethods.includes(lambda?.method)) {
        liveReloadClients()
      }
    }

    if (!pluginsRunning && !restarting &&
        watcherPlugins?.length && pluginEvents.includes(event)) {
      (async function runPlugins () {
        pluginsRunning = true
        let invoke = _invoke.bind({}, params)
        let frozen = deepFrozenCopy(inventory)
        let { arc } = frozen.inv._project
        let args = { arc, filename, event, inventory: frozen, invoke }
        for (let plugin of watcherPlugins) {
          try {
            await plugin(args)
          }
          catch (err) {
            update.warn(`Watcher plugin ${plugin.plugin} failed: ${err.message}`)
          }
        }
        pluginsRunning = false
      })()
    }
  })

  watcher.on('error', update.error)

  return watcher
}
