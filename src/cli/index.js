let hydrate = require('@architect/hydrate')
let path = require('path')
let fs = require('fs')
let { version: pkgVer } = require('../../package.json')
let watch = require('node-watch')
let { fingerprint, pathToUnix, updater } = require('@architect/utils')
let readline = require('readline')
let { tmpdir } = require('os')
let sandbox = require('../sandbox')

module.exports = function cli (params = {}, callback) {
  let { version, options = [], inventory } = params
  if (!version) version = `Sandbox ${pkgVer}`
  let symlink = options.some(o => o === '--disable-symlinks') ? false : true
  params.symlink = symlink

  sandbox.start(params, function watching (err) {
    if (err) {
      sandbox.end()
      if (callback) callback(err)
      else process.exit(1)
    }
    else if (callback) callback()

    // Setup
    let update = updater('Sandbox')
    let deprecated = process.env.DEPRECATED
    let watcher = watch(process.cwd(), { recursive: true })
    let workingDirectory = pathToUnix(process.cwd())

    // Arc stuff
    let { inv } = inventory
    let manifest = inv._project.manifest
    let staticFolder = inv.static && inv.static.folder

    // Timers
    let lastEvent
    let arcEventTimer
    let rehydrateArcTimer
    let rehydrateSharedTimer
    let rehydrateStaticTimer
    let rehydrateViewsTimer
    let fingerprintTimer

    let ts = () => {
      if (!process.env.ARC_QUIET) {
        let date = new Date(lastEvent).toLocaleDateString()
        let time = new Date(lastEvent).toLocaleTimeString()
        console.log(`\n[${date}, ${time}]`)
      }
    }

    // Cleanup after any past runs
    let pauseFile = path.join(tmpdir(), '_pause-architect-sandbox-watcher')
    if (fs.existsSync(pauseFile)) {
      fs.unlinkSync(pauseFile)
    }
    let paused = false

    // Rehydrator
    // Only used for file copying, otherwise we rely on symlinking, which is *way* faster
    function rehydrate ({ timer, only, msg, force }) {
      lastEvent = Date.now()
      clearTimeout(timer)
      if (!symlink || force) {
        timer = setTimeout(() => {
          ts()
          let start = Date.now()
          if (msg) update.status(msg)
          hydrate.shared({ only, symlink }, () => {
            let end = Date.now()
            update.done(`${symlink ? 'Symlinks' : 'Files'} rehydrated into functions in ${end - start}ms`)
          })
        }, 50)
      }
    }

    // Listen for important keystrokes
    readline.emitKeypressEvents(process.stdin)
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
    }
    process.stdin.on('keypress', function now (input, key) {
      if (input === 'H') {
        rehydrate({
          timer: arcEventTimer,
          msg: 'Rehydrating all shared files...',
          force: true
        })
      }
      if (input === 'S') {
        rehydrate({
          timer: rehydrateSharedTimer,
          only: 'shared',
          msg: 'Rehydrating src/shared...',
          force: true
        })
      }
      if (input === 'V') {
        rehydrate({
          timer: rehydrateViewsTimer,
          only: 'views',
          msg: 'Rehydrating src/views...',
          force: true
        })
      }
      if (key.sequence === '\u0003') {
        sandbox.end(function (err) {
          if (err) {
            update.err(err)
            process.exit(1)
          }
          if (callback) callback()
          process.exit(0)
        })
      }
    })

    /**
     * Watch for pertinent filesystem changes
     */
    watcher.on('change', function (event, fileName) {

      if (!paused && fs.existsSync(pauseFile)) {
        paused = true
        update.status('Watcher temporarily paused')
      }
      if (paused && !fs.existsSync(pauseFile)) {
        update.status('Watcher no longer paused')
        paused = false
        if (symlink) {
          rehydrate({
            timer: arcEventTimer,
            msg: 'Restoring shared file symlinks...',
            force: true
          })
        }
      }

      // Event criteria
      let fileUpdate = event === 'update'
      let updateOrRemove = event === 'update' || event === 'remove'
      fileName = pathToUnix(fileName)

      /**
       * Reload routes upon changes to Architect project manifest
       */
      if (fileUpdate && (fileName === manifest) && !paused) {
        clearTimeout(arcEventTimer)
        arcEventTimer = setTimeout(() => {
          ts()
          // Always attempt to close the http server, but only reload if necessary
          sandbox.http.end()
          update.status('Architect project manifest changed')

          let start = Date.now()
          let quiet = process.env.ARC_QUIET
          process.env.ARC_QUIET = true
          sandbox.http.start({ quiet: true }, function (err, result) {
            if (!quiet) delete process.env.ARC_QUIET
            if (err) update.err(err)
            // HTTP passes back success message if it actually did need to (re)start
            if (result === 'HTTP successfully started') {
              let end = Date.now()
              update.done(`HTTP routes reloaded in ${end - start}ms`)
              if (deprecated) {
                rehydrate({
                  timer: rehydrateArcTimer,
                  only: 'arcFile',
                  msg: 'Rehydrating functions with new project manifest'
                })
              }
            }
          })
        }, 50)
      }

      /**
       * Rehydrate functions with shared files upon changes to src/shared
       */
      let isShared = fileName.includes(`${workingDirectory}/src/shared`)
      if (updateOrRemove && isShared && !paused) {
        rehydrate({
          timer: rehydrateSharedTimer,
          only: 'shared',
          msg: 'Shared file changed, rehydrating functions...'
        })
      }

      /**
       * Rehydrate functions with shared files upon changes to src/views
       */
      let isViews = fileName.includes(`${workingDirectory}/src/views`)
      if (updateOrRemove && isViews && !paused) {
        rehydrate({
          timer: rehydrateViewsTimer,
          only: 'views',
          msg: 'Views file changed, rehydrating views...'
        })
      }

      /**
       * Regenerate public/static.json upon changes to public/
       */
      if (updateOrRemove && inv.static && !paused &&
          fileName.includes(`${workingDirectory}/${staticFolder}`) &&
          !fileName.includes(`${workingDirectory}/${staticFolder}/static.json`)) {
        clearTimeout(fingerprintTimer)
        fingerprintTimer = setTimeout(() => {
          let start = Date.now()
          fingerprint({ inventory }, function next (err, result) {
            if (err) update.error(err)
            else {
              if (result) {
                let end = Date.now()
                update.status(`Regenerated public/static.json in ${end - start}ms`)
                rehydrate({
                  timer: rehydrateStaticTimer,
                  only: 'staticJson',
                })
              }
            }
          })
        }, 50)
      }

      lastEvent = Date.now()
    })

    /**
     * Watch for sandbox errors
     */
    watcher.on('error', function (err) {
      update.error(`Error:`, err)
    })
  })
}
