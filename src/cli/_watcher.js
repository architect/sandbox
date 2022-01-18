let { existsSync, unlinkSync } = require('fs')
let { join, sep } = require('path')
let { tmpdir } = require('os')
let _inventory = require('@architect/inventory')
let { fingerprint, pathToUnix } = require('@architect/utils')
let chokidar = require('chokidar')
let sandbox = require('../sandbox')

module.exports = function runWatcher (params) {
  if (!params.enable) return

  let { debounce, inventory, rehydrate, symlink, ts, update } = params
  let { cwd } = inventory.inv._project
  let workingDirectory = pathToUnix(cwd)

  try {
    var watcher = chokidar.watch(cwd, {
      ignored: /(node_modules)|(\.git)|([\\\/]vendor[\\\/])/,
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

  // Cleanup after any past runs
  let pauseFile = join(tmpdir(), '_pause-architect-sandbox-watcher')
  if (existsSync(pauseFile)) {
    unlinkSync(pauseFile)
  }

  let ignoredEvents = [ 'addDir', 'unlinkDir', 'ready', 'raw' ]
  let pluginEvents = [ 'add', 'update', 'remove' ]
  let timers = {
    arcEvent: null,
    fingerprint: null,
  }
  let paused = false

  /**
   * Watch for pertinent filesystem changes
   */
  watcher.on('all', function (event, filename) {
    if (ignoredEvents.includes(event)){
      update.debug.status(`Watcher: ignored '${event}' on ${filename}`)
      return
    }
    if (paused && existsSync(pauseFile)) {
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
        })
      }
    }

    // Renormalize events to more be friendlier (or at least RESTier)
    /**/ if (event === 'change') event = 'update'
    else if (event === 'unlink') event = 'remove'
    update.debug.status(`Watcher: '${event}' on ${filename}`)

    // Event criteria
    let fileUpdate = event === 'update'
    let updateOrRemove = event === 'update' || event === 'remove'
    let anyChange = event === 'add' || event === 'update' || event === 'remove'
    filename = pathToUnix(filename)
    let ran = false // Skips over irrelevant ops after something ran

    /**
     * Reload routes upon changes to Architect project manifest
     */
    if (fileUpdate && (filename === manifest)) {
      ran = true
      clearTimeout(timers.arcEvent)
      timers.arcEvent = setTimeout(() => {
        ts()
        // Refresh the Inventory
        _inventory({ cwd }, (err, result) => {
          // If the new Inventory is valid, stop here and let them fix it
          if (err) update.error(err)
          else {
            inventory = result
            refreshInventory()
            update.status('Loaded latest Architect project manifest')

            restart({ inventory, text: 'HTTP routes', type: 'http', update })
            restart({ inventory, text: 'Events', type: 'events', update })
            // TODO: run startup scripts
          }
        })
      }, debounce)
    }

    /**
     * Refresh inventory if preferences or env vars may have changed
     * Note: enumerate both prefs.arc filename in case it is being added for the first time
     */
    if (!ran && anyChange &&
        (filename === join(cwd, '.env') ||
         filename === join(cwd, 'prefs.arc') ||
         filename === join(cwd, 'preferences.arc') ||
         filename === inv._project.globalPreferencesFile)) {
      ran = true
      clearTimeout(timers.arcEvent)
      timers.arcEvent = setTimeout(() => {
        ts()
        // Refresh the Inventory
        _inventory({ cwd }, (err, result) => {
          if (err) update.error(err)
          else {
            inventory = result
            refreshInventory()
            update.status('Loaded latest project preferences')
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
      })
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
      })
    }

    /**
     * Regenerate public/static.json upon changes to public/
     */
    if (!ran && anyChange && inv.static &&
        filename.includes(`${workingDirectory}/${staticFolder}`) &&
        !filename.includes(`${workingDirectory}/${staticFolder}/static.json`)) {
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
              })
            }
          }
        })
      }, debounce)
    }

    if (watcherPlugins?.length && pluginEvents.includes(event)) {
      (async function runPlugins () {
        for (let plugin of watcherPlugins) {
          await plugin({ filename, event, inventory })
        }
      })()
    }
  })

  watcher.on('error', update.error)

  return watcher
}

function restart ({ inventory, text, type, update }) {
  // Always attempt to close the http server, but only reload if necessary
  sandbox[type].end(err => {
    if (err) update.error(err)
    let start = Date.now()
    if (inventory.inv[type]?.length) {
      sandbox[type].start({ inventory, quiet: true }, (err) => {
        if (err) update.error(err)
        else {
          let end = Date.now()
          update.done(`${text} reloaded in ${end - start}ms`)
        }
      })
    }
  })
}
